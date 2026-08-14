/*
  Let CRM staff choose the membership date shown to a customer and hide it
  from the customer profile card when required.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_account_created_at boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.show_account_created_at IS
  'Controls whether the customer dashboard shows the profile creation date.';

CREATE OR REPLACE FUNCTION public.protect_profile_account_date_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS NOT NULL
    AND auth.role() <> 'service_role'
    AND public.current_crm_role() <> 'admin' THEN
    NEW.created_at := OLD.created_at;
    NEW.show_account_created_at := OLD.show_account_created_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_account_date_fields ON public.profiles;

CREATE TRIGGER trg_protect_profile_account_date_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_account_date_fields();
