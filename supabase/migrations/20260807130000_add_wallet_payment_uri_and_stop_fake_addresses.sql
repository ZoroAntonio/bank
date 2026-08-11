/*
  Store an optional standards-based QR/payment URI for networks and token
  transfers that cannot be inferred safely from an address alone.

  New wallet records are intentionally created without fabricated addresses.
  A display-only, realistic-looking address is unsafe because it has no known
  private key and can cause permanent loss when used as a deposit destination.
*/

ALTER TABLE crypto_wallets
  ADD COLUMN IF NOT EXISTS payment_uri text NOT NULL DEFAULT '';

ALTER TABLE tax_wallet_addresses
  ADD COLUMN IF NOT EXISTS symbol text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS network text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_uri text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION generate_wallet_address(network_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Addresses must come from a real custody wallet/provider. They cannot be
  -- generated as random display strings inside the database.
  RETURN '';
END;
$$;

CREATE OR REPLACE FUNCTION generate_tax_wallet_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tax payment destinations also require an explicitly configured real wallet.
  NEW.wallet_address := coalesce(NEW.wallet_address, '');
  RETURN NEW;
END;
$$;
