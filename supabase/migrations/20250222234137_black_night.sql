/*
  # Update orders table schema

  1. Changes
    - Add expected_shipping_date column
    - Update order_date to be required with default value
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add expected_shipping_date if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'expected_shipping_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN expected_shipping_date timestamptz;
  END IF;
END $$;

-- Update order_date to be required
ALTER TABLE orders ALTER COLUMN order_date SET NOT NULL;
ALTER TABLE orders ALTER COLUMN order_date SET DEFAULT now();

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_expected_shipping_date ON orders(expected_shipping_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);