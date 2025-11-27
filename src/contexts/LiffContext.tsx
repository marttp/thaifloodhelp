import { type SendMessagesParams } from '@liff/send-messages'
import liff from '@line/liff'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface LiffContextType {
  isLiffInitialized: boolean
  isLoggedIn: boolean
  isInLiffClient: boolean
  profile: LiffProfile | null
  error: string | null
  isLoading: boolean
  login: () => void
  logout: () => void
  shareTargetPicker: ({
    messages,
    text,
  }: {
    messages?: SendMessagesParams[number][]
    text: string
  }) => Promise<boolean>
  isShareAvailable: boolean
}

const LiffContext = createContext<LiffContextType | undefined>(undefined)

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''

const mobileCheck = (): boolean => {
  const userAgent = navigator.userAgent || ''
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  )
}

const useLiffContext = () => {
  const isInit = useRef(false)

  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isInLiffClient, setIsInLiffClient] = useState(false)
  const [profile, setProfile] = useState<LiffProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const initializeLiff = useCallback(async () => {
    try {
      if (!LIFF_ID) {
        throw new Error('LIFF_ID is not set')
      }

      const isInClient = liff.isInClient()
      setIsInLiffClient(isInClient)

      if (!isInClient) {
        if (mobileCheck()) {
          window.location.replace(`line://app/${LIFF_ID}`)
          setTimeout(() => {
            window.close()
          }, 5000)
          return
        }
      }

      await liff.init({
        liffId: LIFF_ID,
        withLoginOnExternalBrowser: !isInClient,
      })

      setIsLiffInitialized(true)
      console.log('LIFF initialized successfully')

      if (liff.isLoggedIn()) {
        setIsLoggedIn(true)
        await fetchProfile()
      } else if (!isInClient) {
        liff.login()
        return
      }
    } catch (err) {
      console.error('LIFF initialization failed:', err)
      setError(
        err instanceof Error ? err.message : 'LIFF initialization failed',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isInit.current) {
      return
    }
    isInit.current = true

    initializeLiff()
  }, [initializeLiff])

  const fetchProfile = async () => {
    try {
      const liffProfile = await liff.getProfile()
      setProfile({
        userId: liffProfile.userId,
        displayName: liffProfile.displayName,
        pictureUrl: liffProfile.pictureUrl,
        statusMessage: liffProfile.statusMessage,
      })
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    }
  }

  const login = () => {
    if (isLiffInitialized && !isLoggedIn) {
      liff.login()
    }
  }

  const logout = () => {
    if (isLiffInitialized && isLoggedIn) {
      liff.logout()
      setIsLoggedIn(false)
      setProfile(null)
      window.location.reload()
    }
  }

  const shareTargetPicker = async ({
    messages = [],
    text,
  }: {
    messages?: SendMessagesParams[number][]
    text: string
  }) => {
    if (!isLiffInitialized) {
      console.warn('LIFF is not initialized')
      return false
    }

    // If not in LIFF client and not logged in, redirect to LINE login first
    if (!liff.isLoggedIn()) {
      liff.login()
      return false
    }

    if (!liff.isApiAvailable('shareTargetPicker')) {
      console.warn('ShareTargetPicker is not available')
      // Fallback: open LINE share URL
      const lineShareUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`
      window.open(lineShareUrl, '_blank')
      return false
    }

    try {
      if (messages.length === 0) {
        messages.push({
          type: 'text',
          text,
        })
      }

      messages = messages.slice(0, 5) // LIFF allows max 5 messages

      const result = await liff.shareTargetPicker(messages)

      if (result) {
        console.log('ShareTargetPicker result:', result)
        return result.status === 'success'
      }
      return false
    } catch (err) {
      console.error('ShareTargetPicker error:', err)
      throw err
    }
  }

  const isShareAvailable =
    isLiffInitialized && (liff.isApiAvailable?.('shareTargetPicker') || true)

  return {
    isLiffInitialized,
    isLoggedIn,
    isInLiffClient,
    profile,
    error,
    isLoading,
    login,
    logout,
    shareTargetPicker,
    isShareAvailable,
  }
}

export function LiffProvider({ children }: { children: ReactNode }) {
  const liffContextValue = useLiffContext()

  return (
    <LiffContext.Provider value={liffContextValue}>
      {children}
    </LiffContext.Provider>
  )
}

export function useLiff() {
  const context = useContext(LiffContext)
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider')
  }
  return context
}
