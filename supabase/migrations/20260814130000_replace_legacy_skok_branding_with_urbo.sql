/*
  Align legacy branding defaults with the public URBO BANK identity while
  preserving any genuinely custom names and uploaded logo URLs.
*/

ALTER TABLE public.site_branding
  ALTER COLUMN brand_name SET DEFAULT 'URBO BANK',
  ALTER COLUMN brand_keyword SET DEFAULT 'URBO',
  ALTER COLUMN navbar_logo_url SET DEFAULT '/urbo.svg',
  ALTER COLUMN footer_logo_url SET DEFAULT '/urbo.svg',
  ALTER COLUMN legal_contact_email SET DEFAULT 'legal@urbouab.com';

UPDATE public.site_branding
SET
  brand_name = CASE
    WHEN upper(btrim(brand_name)) IN ('SKOK', 'SKOK BANK') THEN 'URBO BANK'
    ELSE brand_name
  END,
  brand_keyword = CASE
    WHEN upper(btrim(brand_keyword)) IN ('SKOK', 'SKOK BANK', 'URBO BANK') THEN 'URBO'
    ELSE brand_keyword
  END,
  navbar_logo_url = CASE
    WHEN navbar_logo_url ~ '^/skok[0-9]*[.](svg|png)$' THEN '/urbo.svg'
    ELSE navbar_logo_url
  END,
  footer_logo_url = CASE
    WHEN footer_logo_url ~ '^/skok[0-9]*[.](svg|png)$' THEN '/urbo.svg'
    ELSE footer_logo_url
  END,
  legal_contact_email = CASE
    WHEN lower(btrim(legal_contact_email)) = 'legal@skok.bank' THEN 'legal@urbouab.com'
    ELSE legal_contact_email
  END,
  updated_at = now()
WHERE
  upper(btrim(brand_name)) IN ('SKOK', 'SKOK BANK')
  OR upper(btrim(brand_keyword)) IN ('SKOK', 'SKOK BANK', 'URBO BANK')
  OR navbar_logo_url ~ '^/skok[0-9]*[.](svg|png)$'
  OR footer_logo_url ~ '^/skok[0-9]*[.](svg|png)$'
  OR lower(btrim(legal_contact_email)) = 'legal@skok.bank';
