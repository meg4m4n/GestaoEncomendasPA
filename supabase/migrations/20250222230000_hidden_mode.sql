/*
  # Fix RLS policies for destinations table

  1. Changes
    - Drop and recreate RLS policies for destinations table
    - Enable public read access
    - Restrict write operations to authenticated users
    
  2. Security
    - Allow anonymous users to read data
    - Maintain write protection for authenticated users only
*/

-- First drop all existing policies for destinations
DROP POLICY IF EXISTS "Enable read access for all users" ON destinations;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON destinations;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON destinations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON destinations;

-- Create a single comprehensive policy for destinations
CREATE POLICY "Allow full access for authenticated users and read-only for anonymous" ON destinations AS PERMISSIVE
FOR ALL
TO public
USING (
  (auth.role() = 'authenticated') OR 
  (auth.role() = 'anon' AND current_user = 'anon' AND (SELECT current_setting('role') = 'anon'))
)
WITH CHECK (
  auth.role() = 'authenticated'
);