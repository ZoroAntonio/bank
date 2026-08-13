/*
  Allow every authorized CRM staff role to manage the tax summary of customers
  in its assigned scope. The previous function admitted only the global admin
  role, which contradicted the scoped tax_summary_cards RLS policies and caused
  agents and superior managers to receive an HTTP 400 from PostgREST.
*/

CREATE OR REPLACE FUNCTION public.set_tax_summary_card(
  target_user_id uuid,
  target_status text,
  target_amount numeric,
  target_currency text
)
RETURNS SETOF public.tax_summary_cards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_currency text := upper(btrim(COALESCE(target_currency, '')));
  summary_status text;
BEGIN
  IF NOT public.is_crm_staff() OR NOT public.can_manage_user_scope(target_user_id) THEN
    RAISE EXCEPTION 'You are not authorized to manage this customer tax summary'
      USING ERRCODE = '42501';
  END IF;

  IF target_status IS NULL OR target_status NOT IN ('pending', 'on_hold', 'paid') THEN
    RAISE EXCEPTION 'Invalid tax status'
      USING ERRCODE = '22023';
  END IF;

  IF target_amount IS NULL OR target_amount < 0 THEN
    RAISE EXCEPTION 'Tax amount must be zero or greater'
      USING ERRCODE = '22023';
  END IF;

  IF normalized_currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Currency must be a three-letter ISO code'
      USING ERRCODE = '22023';
  END IF;

  FOREACH summary_status IN ARRAY ARRAY['pending', 'on_hold', 'paid']
  LOOP
    INSERT INTO public.tax_summary_cards (user_id, status, amount, currency, updated_at)
    VALUES (
      target_user_id,
      summary_status,
      CASE WHEN summary_status = target_status THEN target_amount ELSE 0 END,
      normalized_currency,
      now()
    )
    ON CONFLICT (user_id, status) DO UPDATE
    SET
      amount = CASE
        WHEN tax_summary_cards.status = target_status THEN target_amount
        ELSE tax_summary_cards.amount
      END,
      currency = normalized_currency,
      updated_at = now();
  END LOOP;

  RETURN QUERY
  SELECT *
  FROM public.tax_summary_cards
  WHERE user_id = target_user_id
  ORDER BY status;
END;
$$;

REVOKE ALL ON FUNCTION public.set_tax_summary_card(uuid, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_tax_summary_card(uuid, text, numeric, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
