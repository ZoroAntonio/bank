/*
  # Use invoice-friendly banking transaction fields

  Renames the existing banking transaction fields without losing their data:
    - `poi` -> `reference`
    - `details` -> `amount`
    - `comment` -> `description`

  Also adds `notes`, which is displayed in the Notes section of the transaction
  invoice. All four fields remain text because the existing CRM amount field was
  stored as text and can include a currency symbol or code.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'poi'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'reference'
  ) THEN
    ALTER TABLE public.transactions RENAME COLUMN poi TO reference;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'details'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.transactions RENAME COLUMN details TO amount;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'comment'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.transactions RENAME COLUMN comment TO description;
  END IF;
END $$;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS amount text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE public.transactions
SET
  reference = COALESCE(reference, ''),
  amount = COALESCE(amount, ''),
  description = COALESCE(description, ''),
  notes = COALESCE(notes, '');

ALTER TABLE public.transactions
  ALTER COLUMN reference SET DEFAULT '',
  ALTER COLUMN reference SET NOT NULL,
  ALTER COLUMN amount SET DEFAULT '',
  ALTER COLUMN amount SET NOT NULL,
  ALTER COLUMN description SET DEFAULT '',
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN notes SET DEFAULT '',
  ALTER COLUMN notes SET NOT NULL;

NOTIFY pgrst, 'reload schema';
