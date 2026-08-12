/*
  # Add public institutional identification settings

  Keeps the footer's MFI identifiers and depositor-protection destination in the
  same singleton row already managed by CRM admins. Existing RLS policies on
  `site_branding` continue to provide public read access and admin-only writes.
*/

ALTER TABLE public.site_branding
  ADD COLUMN IF NOT EXISTS mfi_id text NOT NULL DEFAULT 'PL10026',
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'PL',
  ADD COLUMN IF NOT EXISTS mfi_code text NOT NULL DEFAULT '10026',
  ADD COLUMN IF NOT EXISTS institutional_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS institutional_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS mfi_id_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS depositor_protection_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS depositor_protection_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS depositor_protection_url text NOT NULL
    DEFAULT 'https://www.gov.pl/web/finance/protection-of-depositors';

COMMENT ON COLUMN public.site_branding.mfi_id IS
  'Public Monetary Financial Institution identifier shown in the footer.';
COMMENT ON COLUMN public.site_branding.country_code IS
  'Public institution country code shown in the footer.';
COMMENT ON COLUMN public.site_branding.mfi_code IS
  'Public institution MFI code shown in the footer.';
COMMENT ON COLUMN public.site_branding.institutional_title IS
  'Optional footer section heading override; an empty value uses the translated default.';
COMMENT ON COLUMN public.site_branding.institutional_description IS
  'Optional footer institution description override; an empty value uses the translated default.';
COMMENT ON COLUMN public.site_branding.mfi_id_note IS
  'Optional footer MFI note override; an empty value uses translated or generated copy.';
COMMENT ON COLUMN public.site_branding.depositor_protection_title IS
  'Optional depositor-protection card title override; an empty value uses the translated default.';
COMMENT ON COLUMN public.site_branding.depositor_protection_description IS
  'Optional depositor-protection card description override; an empty value uses the translated default.';
COMMENT ON COLUMN public.site_branding.depositor_protection_url IS
  'Public URL opened by the footer depositor-protection card.';
