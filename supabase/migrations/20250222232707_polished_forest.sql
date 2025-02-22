/*
  # Add order_date column to orders table

  1. Changes
    - Add order_date column to orders table
    - Set default value to now()
    - Update existing rows to have order_date set to created_at
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_date timestamptz DEFAULT now();
    UPDATE orders SET order_date = created_at WHERE order_date IS NULL;
  END IF;
END $$;