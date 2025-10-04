/*
  # Seller Marketplace Database Schema

  ## Overview
  This migration creates the complete database schema for a seller-focused marketplace application
  where sellers can manage products from a master catalog, handle orders, and track their business.

  ## New Tables Created

  ### 1. sellers
  - `id` (uuid, primary key) - References auth.users
  - `shop_name` (text) - Name of the seller's shop
  - `owner_name` (text) - Owner's full name
  - `phone` (text) - Contact phone number
  - `email` (text) - Contact email
  - `address` (text) - Shop address
  - `gst_number` (text, nullable) - GST/Business ID
  - `logo_url` (text, nullable) - Shop logo image URL
  - `banner_url` (text, nullable) - Shop banner image URL
  - `is_verified` (boolean) - Verification status
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. master_products
  - `id` (uuid, primary key) - Product identifier
  - `name` (text) - Product name
  - `brand` (text) - Product brand
  - `category` (text) - Product category
  - `base_price` (decimal) - Platform base price
  - `description` (text, nullable) - Product description
  - `image_url` (text, nullable) - Product image URL
  - `is_active` (boolean) - Whether product is available on platform
  - `created_at` (timestamptz) - Product creation timestamp

  ### 3. seller_products
  - `id` (uuid, primary key) - Seller product entry identifier
  - `seller_id` (uuid) - References sellers table
  - `product_id` (uuid) - References master_products table
  - `custom_price` (decimal, nullable) - Seller's custom price (if allowed)
  - `stock_status` (text) - 'available' or 'out_of_stock'
  - `added_at` (timestamptz) - When seller added this product
  - Unique constraint on (seller_id, product_id)

  ### 4. orders
  - `id` (uuid, primary key) - Order identifier
  - `seller_id` (uuid) - References sellers table
  - `buyer_name` (text) - Customer name
  - `buyer_phone` (text) - Customer phone
  - `buyer_address` (text) - Delivery address
  - `status` (text) - Order status: 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'
  - `total_amount` (decimal) - Order total amount
  - `created_at` (timestamptz) - Order creation timestamp
  - `updated_at` (timestamptz) - Last status update timestamp

  ### 5. order_items
  - `id` (uuid, primary key) - Order item identifier
  - `order_id` (uuid) - References orders table
  - `product_id` (uuid) - References master_products table
  - `quantity` (integer) - Quantity ordered
  - `price` (decimal) - Price at time of order
  - `created_at` (timestamptz) - Item creation timestamp

  ### 6. notifications
  - `id` (uuid, primary key) - Notification identifier
  - `seller_id` (uuid) - References sellers table
  - `type` (text) - Notification type: 'new_order', 'stock_alert', 'payment_settlement'
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz) - Notification creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Sellers can only access and modify their own data
  - Master products are readable by all authenticated sellers
  - Strict ownership policies for orders, products, and notifications
*/

-- Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name text NOT NULL,
  owner_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  gst_number text,
  logo_url text,
  banner_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own profile"
  ON sellers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Sellers can insert own profile"
  ON sellers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Sellers can update own profile"
  ON sellers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create master_products table
CREATE TABLE IF NOT EXISTS master_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated sellers can view master products"
  ON master_products FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create seller_products table
CREATE TABLE IF NOT EXISTS seller_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES master_products(id) ON DELETE CASCADE,
  custom_price decimal(10,2),
  stock_status text NOT NULL DEFAULT 'available' CHECK (stock_status IN ('available', 'out_of_stock')),
  added_at timestamptz DEFAULT now(),
  UNIQUE(seller_id, product_id)
);

ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own products"
  ON seller_products FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own products"
  ON seller_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON seller_products FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON seller_products FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_address text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  total_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES master_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.seller_id = auth.uid()
    )
  );

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_order', 'stock_alert', 'payment_settlement', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_seller_products_seller_id ON seller_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_seller_id ON notifications(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Insert sample master products for testing
INSERT INTO master_products (name, brand, category, base_price, description, image_url) VALUES
  ('Wireless Bluetooth Headphones', 'SoundMax', 'Electronics', 1999.00, 'Premium wireless headphones with noise cancellation', 'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg'),
  ('Organic Green Tea (100g)', 'TeaGarden', 'Food & Beverages', 299.00, 'Premium organic green tea leaves', 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg'),
  ('Cotton T-Shirt', 'StyleCo', 'Clothing', 499.00, 'Comfortable cotton t-shirt in multiple colors', 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'),
  ('Yoga Mat', 'FitLife', 'Sports & Fitness', 799.00, 'Non-slip yoga mat with carrying strap', 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg'),
  ('LED Desk Lamp', 'BrightHome', 'Home & Living', 1299.00, 'Adjustable LED desk lamp with touch control', 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg'),
  ('Protein Shake Powder (1kg)', 'ProFit', 'Health & Nutrition', 2499.00, 'Whey protein isolate for muscle building', 'https://images.pexels.com/photos/4114739/pexels-photo-4114739.jpeg'),
  ('Ceramic Coffee Mug', 'MugLife', 'Kitchen & Dining', 199.00, 'Handcrafted ceramic coffee mug', 'https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg'),
  ('Smartphone Stand', 'TechEase', 'Accessories', 349.00, 'Adjustable aluminum smartphone stand', 'https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg')
ON CONFLICT DO NOTHING;