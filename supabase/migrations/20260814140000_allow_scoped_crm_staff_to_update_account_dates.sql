/*
  Allow agents and superior managers to manage the account date preferences of
  profiles already covered by their CRM scope. Existing profile RLS policies
  continue to prevent staff from updating users outside that scope, while
  ordinary customers remain unable to edit these protected fields.
*/

CREATE OR REPLACE FUNCTION public.protect_profile_account_date_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS NOT NULL
    AND auth.role() <> 'service_role'
    AND NOT public.is_crm_staff() THEN
    NEW.created_at := OLD.created_at;
    NEW.show_account_created_at := OLD.show_account_created_at;
  END IF;

  RETURN NEW;
END;
$$;

-- The general privileged-field trigger historically froze created_at for all
-- non-admin roles. Keep every other hierarchy and KYC safeguard intact while
-- allowing scoped CRM staff updates to reach the account-date trigger above.
CREATE OR REPLACE FUNCTION public.secure_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text := public.current_crm_role();
  v_assigned_agent_manager_id uuid;
  v_kyc_submission_user_id text := current_setting('app.kyc_submission_user_id', true);
BEGIN
  NEW.crm_role := CASE
    WHEN lower(btrim(COALESCE(NEW.crm_role, ''))) IN ('customer', 'agent', 'superior_manager', 'admin') THEN lower(btrim(NEW.crm_role))
    WHEN COALESCE(NEW.is_admin, false) THEN 'admin'
    ELSE 'customer'
  END;

  IF auth.role() IS NULL OR auth.role() = 'service_role' THEN
    NULL;
  ELSIF TG_OP = 'INSERT' THEN
    IF v_actor_role <> 'admin' THEN
      NEW.crm_role := 'customer';
      NEW.is_admin := false;
      NEW.kyc_status := 'pending';
      NEW.account_iban := '';
      NEW.assigned_manager_id := null;
      NEW.assigned_agent_id := null;
    END IF;
  ELSIF v_actor_role = 'admin' THEN
    NULL;
  ELSIF v_actor_role = 'superior_manager' THEN
    NEW.id := OLD.id;
    NEW.crm_role := OLD.crm_role;
    NEW.is_admin := OLD.is_admin;
    NEW.assigned_manager_id := OLD.assigned_manager_id;

    IF OLD.crm_role <> 'customer' THEN
      NEW.assigned_agent_id := OLD.assigned_agent_id;
    ELSIF NEW.assigned_agent_id IS DISTINCT FROM OLD.assigned_agent_id AND NEW.assigned_agent_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1
        FROM public.profiles AS agent_profile
        WHERE agent_profile.id = NEW.assigned_agent_id
          AND public.get_crm_role(agent_profile.id) = 'agent'
          AND agent_profile.assigned_manager_id = auth.uid()
      ) THEN
        RAISE EXCEPTION 'Superior managers can assign only their own agents';
      END IF;
    END IF;
  ELSIF v_actor_role = 'agent' THEN
    NEW.id := OLD.id;
    NEW.crm_role := OLD.crm_role;
    NEW.is_admin := OLD.is_admin;
    NEW.assigned_manager_id := OLD.assigned_manager_id;
    NEW.assigned_agent_id := OLD.assigned_agent_id;
  ELSE
    NEW.id := OLD.id;
    NEW.created_at := OLD.created_at;
    NEW.crm_role := OLD.crm_role;
    NEW.is_admin := OLD.is_admin;
    NEW.account_iban := OLD.account_iban;
    NEW.assigned_manager_id := OLD.assigned_manager_id;
    NEW.assigned_agent_id := OLD.assigned_agent_id;

    IF OLD.id = auth.uid()
      AND OLD.kyc_status IN ('pending', 'rejected')
      AND NEW.kyc_status = 'submitted'
      AND v_kyc_submission_user_id = OLD.id::text
      AND EXISTS (
        SELECT 1
        FROM public.kyc_submissions
        WHERE user_id = OLD.id
      ) THEN
      NEW.kyc_status := 'submitted';
    ELSE
      NEW.kyc_status := OLD.kyc_status;
    END IF;
  END IF;

  IF NEW.id = NEW.assigned_manager_id OR NEW.id = NEW.assigned_agent_id THEN
    RAISE EXCEPTION 'Profiles cannot be assigned to themselves';
  END IF;

  IF NEW.crm_role IN ('admin', 'superior_manager') THEN
    NEW.assigned_manager_id := null;
    NEW.assigned_agent_id := null;
  ELSIF NEW.crm_role = 'agent' THEN
    NEW.assigned_agent_id := null;

    IF NEW.assigned_manager_id IS NOT NULL
      AND public.get_crm_role(NEW.assigned_manager_id) <> 'superior_manager' THEN
      RAISE EXCEPTION 'Agents can be assigned only to superior managers';
    END IF;
  ELSE
    IF NEW.assigned_manager_id IS NOT NULL
      AND public.get_crm_role(NEW.assigned_manager_id) <> 'superior_manager' THEN
      RAISE EXCEPTION 'Customers can be assigned only to superior managers';
    END IF;

    IF NEW.assigned_agent_id IS NOT NULL THEN
      SELECT assigned_manager_id
      INTO v_assigned_agent_manager_id
      FROM public.profiles
      WHERE id = NEW.assigned_agent_id
        AND public.get_crm_role(id) = 'agent';

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Assigned agent must have the agent role';
      END IF;

      IF NEW.assigned_manager_id IS NULL THEN
        NEW.assigned_manager_id := v_assigned_agent_manager_id;
      ELSIF v_assigned_agent_manager_id IS NOT NULL
        AND NEW.assigned_manager_id <> v_assigned_agent_manager_id THEN
        RAISE EXCEPTION 'Assigned agent belongs to a different superior manager';
      END IF;
    END IF;
  END IF;

  NEW.is_admin := (NEW.crm_role = 'admin');
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;
