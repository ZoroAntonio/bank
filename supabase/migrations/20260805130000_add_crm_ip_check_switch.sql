/* Backend master switch for CRM IP whitelist enforcement. */

CREATE TABLE IF NOT EXISTS public.crm_ip_access_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.crm_ip_access_settings (id, enabled)
VALUES (true, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.crm_ip_access_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.crm_ip_access_settings FROM anon;
REVOKE ALL ON TABLE public.crm_ip_access_settings FROM authenticated;
