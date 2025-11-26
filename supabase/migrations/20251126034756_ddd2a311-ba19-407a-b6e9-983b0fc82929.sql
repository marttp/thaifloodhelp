-- Add LINE user fields to reports table
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS line_user_id text,
ADD COLUMN IF NOT EXISTS line_display_name text;