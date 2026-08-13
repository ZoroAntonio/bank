/*
  Tie each customer-created add-funds request to the CRM-managed wallet that
  was displayed at submission time. The snapshots keep the original deposit
  destination auditable even if an administrator later rotates the wallet.
*/

ALTER TABLE public.crypto_deposits
  ADD COLUMN IF NOT EXISTS wallet_id uuid REFERENCES public.crypto_wallets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS wallet_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS network text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_uri text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS crypto_deposits_wallet_id_idx
  ON public.crypto_deposits(wallet_id);

ALTER TABLE public.crypto_deposits
  DROP CONSTRAINT IF EXISTS crypto_deposits_positive_amount;

ALTER TABLE public.crypto_deposits
  ADD CONSTRAINT crypto_deposits_positive_amount
  CHECK (amount > 0) NOT VALID;

-- Deposit and tax destinations are controlled by CRM staff. Customers can
-- read the rows for payment, but cannot replace them through the API.
DROP POLICY IF EXISTS "Users can insert own wallets"
  ON public.crypto_wallets;

DROP POLICY IF EXISTS "Users can update own wallets"
  ON public.crypto_wallets;

DROP POLICY IF EXISTS "Users can insert own tax wallet"
  ON public.tax_wallet_addresses;

DROP POLICY IF EXISTS "Users can update own tax wallet"
  ON public.tax_wallet_addresses;

CREATE OR REPLACE FUNCTION public.snapshot_crypto_deposit_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_wallet public.crypto_wallets%ROWTYPE;
BEGIN
  IF NEW.wallet_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO selected_wallet
  FROM public.crypto_wallets
  WHERE id = NEW.wallet_id
    AND user_id = NEW.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected deposit wallet does not belong to this user.';
  END IF;

  IF upper(trim(selected_wallet.symbol)) <> upper(trim(NEW.symbol)) THEN
    RAISE EXCEPTION 'The selected deposit wallet does not match the deposit asset.';
  END IF;

  IF trim(selected_wallet.wallet_address) = '' THEN
    RAISE EXCEPTION 'The selected deposit wallet has no configured address.';
  END IF;

  NEW.symbol := upper(trim(selected_wallet.symbol));
  NEW.crypto_name := coalesce(nullif(trim(selected_wallet.name), ''), NEW.symbol);
  NEW.wallet_address := trim(selected_wallet.wallet_address);
  NEW.network := trim(selected_wallet.network);
  NEW.payment_uri := coalesce(nullif(trim(selected_wallet.payment_uri), ''), trim(NEW.payment_uri));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS snapshot_crypto_deposit_wallet_before_write
  ON public.crypto_deposits;

CREATE TRIGGER snapshot_crypto_deposit_wallet_before_write
  BEFORE INSERT OR UPDATE OF wallet_id, user_id, symbol
  ON public.crypto_deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_crypto_deposit_wallet();

DROP POLICY IF EXISTS "Users can insert own crypto deposits"
  ON public.crypto_deposits;

-- Customers submit deposits; only CRM staff may change or remove them. This
-- prevents a customer from changing their own request to `approved` and
-- firing the balance-credit trigger.
DROP POLICY IF EXISTS "Users can update own crypto deposits"
  ON public.crypto_deposits;

DROP POLICY IF EXISTS "Users can delete own crypto deposits"
  ON public.crypto_deposits;

CREATE POLICY "Users can insert own crypto deposits"
  ON public.crypto_deposits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND wallet_id IS NOT NULL
    AND status = 'pending'
  );
