/*
  # Replace public MFI identifiers with one editable license value

  The legacy MFI columns remain in place for backward-compatible data retention,
  but the website and CRM now use only this license field.
*/

ALTER TABLE public.site_branding
  ADD COLUMN IF NOT EXISTS license text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.site_branding.license IS
  'Free-form public license text shown in the footer and managed from the CRM.';
