/*
  # CRM administrator IP whitelist

  The whitelist is managed through the crm-ip-access Edge Function so that the
  caller's network address is determined by the server, not by browser input.
  Direct API access is disabled; all reads and writes go through the Edge
  Function, which verifies both the caller role and the caller IP.
*/

CREATE TABLE IF NOT EXISTS public.crm_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_ip_whitelist ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.crm_ip_whitelist FROM anon;
REVOKE ALL ON TABLE public.crm_ip_whitelist FROM authenticated;
