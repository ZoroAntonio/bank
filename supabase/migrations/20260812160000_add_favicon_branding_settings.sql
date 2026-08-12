/*
  # Add generated favicon settings

  Stores the public URLs generated from a single CRM-admin favicon source image.
  The existing public-read/admin-write policies on site_branding and the
  site-branding storage bucket also protect these values and files.
*/

ALTER TABLE public.site_branding
  ADD COLUMN IF NOT EXISTS favicon_ico_url text NOT NULL DEFAULT '/favicon.ico',
  ADD COLUMN IF NOT EXISTS favicon_16_url text NOT NULL DEFAULT '/favicon-16x16.png',
  ADD COLUMN IF NOT EXISTS favicon_32_url text NOT NULL DEFAULT '/favicon-32x32.png',
  ADD COLUMN IF NOT EXISTS apple_touch_icon_url text NOT NULL DEFAULT '/apple-touch-icon.png',
  ADD COLUMN IF NOT EXISTS favicon_192_url text NOT NULL DEFAULT '/android-chrome-192x192.png',
  ADD COLUMN IF NOT EXISTS favicon_512_url text NOT NULL DEFAULT '/android-chrome-512x512.png';

COMMENT ON COLUMN public.site_branding.favicon_ico_url IS 'Generated multi-size ICO favicon URL.';
COMMENT ON COLUMN public.site_branding.favicon_16_url IS 'Generated 16x16 PNG favicon URL.';
COMMENT ON COLUMN public.site_branding.favicon_32_url IS 'Generated 32x32 PNG favicon URL.';
COMMENT ON COLUMN public.site_branding.apple_touch_icon_url IS 'Generated 180x180 Apple touch icon URL.';
COMMENT ON COLUMN public.site_branding.favicon_192_url IS 'Generated 192x192 progressive web app icon URL.';
COMMENT ON COLUMN public.site_branding.favicon_512_url IS 'Generated 512x512 progressive web app icon URL.';
