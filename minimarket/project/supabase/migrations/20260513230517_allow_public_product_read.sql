/*
  # Allow public read access to active products

  1. Changes
    - Drop existing "Anyone can read active products" policy
    - Create new policy allowing unauthenticated users to read active products
    - Also allow public read for active discounts
*/

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can read active products" ON products;
DROP POLICY IF EXISTS "Anyone can read active discounts" ON discounts;

-- Create new public read policies
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can read active discounts"
  ON discounts FOR SELECT
  TO public
  USING (is_active = true);
