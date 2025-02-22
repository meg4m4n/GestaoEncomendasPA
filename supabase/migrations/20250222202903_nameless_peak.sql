/*
  # Initial Schema for Order Management System

  1. New Tables
    - `suppliers` - Stores supplier information
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `country` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `carriers` - Stores shipping carrier information
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `country` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `destinations` - Stores destination information
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `country` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `container_types` - Stores container type information
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamp)

    - `orders` - Stores order information
      - `id` (uuid, primary key)
      - `reference` (text, unique)
      - `supplier_id` (uuid, foreign key)
      - `destination_id` (uuid, foreign key)
      - `carrier_id` (uuid, foreign key)
      - `product_description` (text)
      - `container_type` (text)
      - `transport_price` (numeric)
      - `order_value` (numeric)
      - `initial_payment_date` (timestamp)
      - `initial_payment_amount` (numeric)
      - `final_payment_date` (timestamp)
      - `final_payment_amount` (numeric)
      - `expected_start_date` (timestamp)
      - `container_reference` (text)
      - `etd` (timestamp) -- Estimated Time of Departure
      - `eta` (timestamp) -- Estimated Time of Arrival
      - `ata` (timestamp) -- Actual Time of Arrival
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  country text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  country text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create destinations table
CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  country text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create container_types table
CREATE TABLE IF NOT EXISTS container_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
  destination_id uuid REFERENCES destinations(id) ON DELETE RESTRICT,
  carrier_id uuid REFERENCES carriers(id) ON DELETE RESTRICT,
  product_description text,
  container_type text,
  transport_price numeric,
  order_value numeric,
  initial_payment_date timestamptz,
  initial_payment_amount numeric,
  final_payment_date timestamptz,
  final_payment_amount numeric,
  expected_start_date timestamptz,
  container_reference text,
  etd timestamptz,
  eta timestamptz,
  ata timestamptz,
  status text CHECK (status IN ('in_production', 'in_transit', 'delivered', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for authenticated users" ON suppliers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON carriers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON destinations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON container_types
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON orders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at
    BEFORE UPDATE ON carriers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_destinations_updated_at
    BEFORE UPDATE ON destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some container types
INSERT INTO container_types (name, description, image_url) VALUES
  ('20GP', '20ft General Purpose Container', 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3'),
  ('40GP', '40ft General Purpose Container', 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c4'),
  ('40HQ', '40ft High Cube Container', 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c5'),
  ('45HQ', '45ft High Cube Container', 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c6');