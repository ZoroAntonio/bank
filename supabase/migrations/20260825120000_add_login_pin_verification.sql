/*
  Add a CRM-managed four-digit login PIN as a second step after password auth.

  PINs are kept in a dedicated, RLS-locked table as bcrypt hashes. Customers
  can only submit a PIN to the verification RPC; neither customers nor CRM
  staff can select the stored hash. A successful verification is bound to the
  current Supabase Auth session_id, so a new login requires the PIN again.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.login_pin_credentials (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.login_pin_sessions (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, session_id)
);

ALTER TABLE public.login_pin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_pin_sessions ENABLE ROW LEVEL SECURITY;

-- Intentionally no direct table policies. Access is only through the
-- SECURITY DEFINER functions below (and the service role).
REVOKE ALL ON TABLE public.login_pin_credentials FROM anon, authenticated;
REVOKE ALL ON TABLE public.login_pin_sessions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_client_login_pin(
  p_user_id uuid,
  p_pin text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'A client user ID is required';
  END IF;

  IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'PIN must contain exactly 4 digits';
  END IF;

  IF auth.role() IS DISTINCT FROM 'service_role'
    AND NOT (public.is_crm_staff() AND public.can_manage_profile(p_user_id)) THEN
    RAISE EXCEPTION 'You are not allowed to change this client PIN';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Client profile was not found';
  END IF;

  INSERT INTO public.login_pin_credentials (
    user_id,
    pin_hash,
    failed_attempts,
    locked_until,
    updated_at
  )
  VALUES (
    p_user_id,
    extensions.crypt(p_pin, extensions.gen_salt('bf', 10)),
    0,
    null,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET pin_hash = EXCLUDED.pin_hash,
      failed_attempts = 0,
      locked_until = null,
      updated_at = now();

  -- A changed PIN invalidates every already verified browser session.
  DELETE FROM public.login_pin_sessions WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_login_pin(p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session_id text := auth.jwt() ->> 'session_id';
  v_pin_hash text;
  v_failed_attempts integer;
  v_locked_until timestamptz;
  v_next_failed_attempts integer;
BEGIN
  IF v_user_id IS NULL OR v_session_id IS NULL OR v_session_id = '' THEN
    RETURN 'session_missing';
  END IF;

  IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN
    RETURN 'invalid';
  END IF;

  SELECT pin_hash, failed_attempts, locked_until
  INTO v_pin_hash, v_failed_attempts, v_locked_until
  FROM public.login_pin_credentials
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_set';
  END IF;

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RETURN 'locked';
  END IF;

  IF extensions.crypt(p_pin, v_pin_hash) = v_pin_hash THEN
    UPDATE public.login_pin_credentials
    SET failed_attempts = 0,
        locked_until = null,
        updated_at = now()
    WHERE user_id = v_user_id;

    INSERT INTO public.login_pin_sessions (user_id, session_id, verified_at)
    VALUES (v_user_id, v_session_id, now())
    ON CONFLICT (user_id, session_id) DO UPDATE
    SET verified_at = now();

    RETURN 'verified';
  END IF;

  v_next_failed_attempts := COALESCE(v_failed_attempts, 0) + 1;

  IF v_next_failed_attempts >= 5 THEN
    UPDATE public.login_pin_credentials
    SET failed_attempts = 0,
        locked_until = now() + interval '15 minutes',
        updated_at = now()
    WHERE user_id = v_user_id;
    RETURN 'locked';
  END IF;

  UPDATE public.login_pin_credentials
  SET failed_attempts = v_next_failed_attempts,
      locked_until = null,
      updated_at = now()
  WHERE user_id = v_user_id;

  RETURN 'invalid';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_login_pin_verified()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    -- Preserve access for existing CRM staff accounts until a PIN is assigned.
    -- Once staff receive a PIN, they use the same second step as customers.
    WHEN public.is_crm_staff() AND NOT EXISTS (
      SELECT 1 FROM public.login_pin_credentials WHERE user_id = auth.uid()
    ) THEN true
    WHEN COALESCE(auth.jwt() ->> 'session_id', '') = '' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.login_pin_sessions
      WHERE user_id = auth.uid()
        AND session_id = auth.jwt() ->> 'session_id'
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.set_client_login_pin(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_login_pin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_login_pin_verified() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.set_client_login_pin(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_login_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_login_pin_verified() TO authenticated;
