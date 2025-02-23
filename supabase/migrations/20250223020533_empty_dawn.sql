/*
  # Add document management support
  
  1. New Tables
    - `order_documents`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `name` (text)
      - `file_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Storage
    - Create bucket for order documents
  
  3. Security
    - Enable RLS on order_documents table
    - Add policies for authenticated users
*/

-- Create order_documents table
CREATE TABLE IF NOT EXISTS order_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger
CREATE TRIGGER update_order_documents_updated_at
    BEFORE UPDATE ON order_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON order_documents
  FOR SELECT
  USING (true);

CREATE POLICY "Enable write access for authenticated users" ON order_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON order_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON order_documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-documents', 'order-documents', true);

-- Create storage policy
CREATE POLICY "Give access to authenticated users"
ON storage.objects FOR ALL USING (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);