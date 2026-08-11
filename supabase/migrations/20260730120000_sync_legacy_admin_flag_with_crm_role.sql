/*
  Keep the legacy is_admin flag and the newer crm_role field consistent.

  Older/admin-console workflows may promote a user by changing only is_admin.
  In that case crm_role='customer' must not hide the administrator status from
  route guards or row-level security helpers.
*/

UPDATE public.profiles
SET
  crm_role = 'admin',
  updated_at = now()
WHERE is_admin = true
  AND crm_role IS DISTINCT FROM 'admin';

CREATE OR REPLACE FUNCTION public.get_crm_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN is_admin THEN 'admin'
        WHEN lower(btrim(COALESCE(crm_role, ''))) IN
          ('customer', 'agent', 'superior_manager', 'admin')
          THEN lower(btrim(crm_role))
        ELSE 'customer'
      END
      FROM public.profiles
      WHERE id = p_user_id
    ),
    'customer'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_crm_role(uuid) TO authenticated;
