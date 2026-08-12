/*
  # Add shared legal contact email

  Stores one public legal contact email for the Privacy Policy, Terms of
  Service, and Disclosures pages. Existing site_branding RLS policies keep
  reads public and writes restricted to CRM administrators.
*/

ALTER TABLE public.site_branding
  ADD COLUMN IF NOT EXISTS legal_contact_email text NOT NULL DEFAULT 'legal@skok.bank';

UPDATE public.site_branding
SET legal_contact_email = 'legal@skok.bank'
WHERE nullif(btrim(legal_contact_email), '') IS NULL;

COMMENT ON COLUMN public.site_branding.legal_contact_email IS
  'Shared public email displayed by all legal Contact Us sections.';

