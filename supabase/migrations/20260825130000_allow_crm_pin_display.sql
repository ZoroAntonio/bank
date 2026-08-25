/*
  Allow authorized CRM staff to view the current client PIN in plain text.

  The plain value remains in the RLS-locked credential table and is exposed
  only by an RPC that applies the existing CRM hierarchy/scope checks.
  Previously hashed PINs cannot be recovered and remain null until reset.
*/

ALTER TABLE public.login_pin_credentials
  ADD COLUMN IF NOT EXISTS plain_pin text;

ALTER TABLE public.login_pin_credentials
  DROP CONSTRAINT IF EXISTS login_pin_credentials_plain_pin_check;

ALTER TABLE public.login_pin_credentials
  ADD CONSTRAINT login_pin_credentials_plain_pin_check
  CHECK (plain_pin IS NULL OR plain_pin ~ '^[0-9]{4}$');

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
    plain_pin,
    failed_attempts,
    locked_until,
    updated_at
  )
  VALUES (
    p_user_id,
    extensions.crypt(p_pin, extensions.gen_salt('bf', 10)),
    p_pin,
    0,
    null,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET pin_hash = EXCLUDED.pin_hash,
      plain_pin = EXCLUDED.plain_pin,
      failed_attempts = 0,
      locked_until = null,
      updated_at = now();

  DELETE FROM public.login_pin_sessions WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_managed_login_pins()
RETURNS TABLE (
  user_id uuid,
  login_pin text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_crm_staff() THEN
    RAISE EXCEPTION 'CRM staff access is required';
  END IF;

  RETURN QUERY
  SELECT credentials.user_id, credentials.plain_pin
  FROM public.login_pin_credentials AS credentials
  WHERE public.can_manage_profile(credentials.user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_managed_login_pins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_managed_login_pins() TO authenticated;
