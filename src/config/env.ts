import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod/v4'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_SUPABASE_PROJECT_ID: z.string().min(1),
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    VITE_SUPABASE_URL: z.string().min(1),
    VITE_LIFF_ID: z.string().min(1),
    VITE_MAP_DEFAULT_LAT: z.string().min(1),
    VITE_MAP_DEFAULT_LNG: z.string().min(1),
    VITE_MAP_DEFAULT_ZOOM: z.string().min(1),
    VITE_MAP_USE_DEFAULT_LOCATION: z.string().min(1),
    VITE_GISTDA_API_KEY: z.string().min(1),
  },
  runtimeEnv: import.meta.env,
})
