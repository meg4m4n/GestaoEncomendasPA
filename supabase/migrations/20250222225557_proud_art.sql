/*
  # Fix RLS policies for all tables

  1. Changes
    - Drop existing RLS policies
    - Create new policies that properly handle both authenticated and anonymous access
    - Enable public read access while maintaining write protection
    
  2. Security
    - Allow anonymous users to read data
    - Restrict write operations to authenticated users only
    - Maintain data integrity through proper policy configuration
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON carriers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON destinations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON container_types;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON orders;

-- Create new read policies for all users
CREATE POLICY "Enable read access for all users" ON suppliers
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users" ON carriers
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users" ON destinations
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users" ON container_types
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users" ON orders
  FOR SELECT
  USING (true);

-- Create write policies for authenticated users
CREATE POLICY "Enable write access for authenticated users" ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable write access for authenticated users" ON carriers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable write access for authenticated users" ON destinations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable write access for authenticated users" ON container_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable write access for authenticated users" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create update policies for authenticated users
CREATE POLICY "Enable update access for authenticated users" ON suppliers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON carriers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON destinations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON container_types
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create delete policies for authenticated users
CREATE POLICY "Enable delete access for authenticated users" ON suppliers
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON carriers
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON destinations
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON container_types
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON orders
  FOR DELETE
  TO authenticated
  USING (true);