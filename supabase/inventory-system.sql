-- EventGaraget Inventory & Availability System
-- Detta system hanterar lager, tillgänglighet och dubbelbokning

-- Products catalog (alla produkter i lager)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100), -- tält, möbler, golv, värmepumpar, etc
  description TEXT,
  base_price_per_day DECIMAL(10, 2) NOT NULL,
  quantity_total INTEGER NOT NULL DEFAULT 1, -- Totalt antal av denna produkt
  quantity_available INTEGER NOT NULL DEFAULT 1, -- Aktuellt antal lediga
  requires_setup BOOLEAN DEFAULT false,
  setup_cost DECIMAL(10, 2) DEFAULT 0,
  can_be_wrapped BOOLEAN DEFAULT false, -- Kan folieras?
  wrapping_cost DECIMAL(10, 2) DEFAULT 0,
  image_url TEXT,
  specifications JSONB, -- Tekniska specs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items (specifika artiklar - t.ex. Tält #1, Tält #2)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  item_number VARCHAR(50) UNIQUE NOT NULL, -- T.ex. "TENT-4X8-001"
  status VARCHAR(50) DEFAULT 'available', -- available, booked, maintenance, damaged
  condition VARCHAR(50) DEFAULT 'good', -- good, fair, poor
  purchase_date DATE,
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  location VARCHAR(100), -- Var finns den?
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking items (koppling mellan bokningar och specifika lager-artiklar)
CREATE TABLE IF NOT EXISTS booking_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  reserved_from DATE NOT NULL,
  reserved_to DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'reserved', -- reserved, delivered, returned, damaged
  is_wrapped BOOLEAN DEFAULT false, -- Är folier​ad?
  wrapping_design_url TEXT, -- Länk till folieringsdesign
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability calendar (snabb uppslagstabell)
CREATE TABLE IF NOT EXISTS availability_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity_booked INTEGER DEFAULT 0,
  quantity_available INTEGER NOT NULL,
  UNIQUE(product_id, date)
);

-- Create indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_inventory_items_product ON inventory_items(product_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX idx_booking_items_dates ON booking_items(reserved_from, reserved_to);
CREATE INDEX idx_availability_calendar_product_date ON availability_calendar(product_id, date);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access products" ON products FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access inventory_items" ON inventory_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access booking_items" ON booking_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access availability_calendar" ON availability_calendar FOR ALL TO service_role USING (true);

-- Public can read products (för prislista)
CREATE POLICY "Public can read products" ON products FOR SELECT TO anon USING (true);

-- Update trigger
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- FUNCTION: Check Product Availability
-- ==========================================
CREATE OR REPLACE FUNCTION check_product_availability(
  p_product_name VARCHAR,
  p_start_date DATE,
  p_end_date DATE,
  p_quantity_needed INTEGER DEFAULT 1
)
RETURNS TABLE (
  is_available BOOLEAN,
  quantity_available INTEGER,
  quantity_requested INTEGER,
  conflicting_dates DATE[]
) AS $$
DECLARE
  v_product_id UUID;
  v_total_quantity INTEGER;
  v_max_booked INTEGER;
  v_available INTEGER;
  v_conflicts DATE[];
BEGIN
  -- Get product ID and total quantity
  SELECT id, quantity_total INTO v_product_id, v_total_quantity
  FROM products
  WHERE LOWER(name) = LOWER(p_product_name);
  
  IF v_product_id IS NULL THEN
    RETURN QUERY SELECT false, 0, p_quantity_needed, ARRAY[]::DATE[];
    RETURN;
  END IF;
  
  -- Check max booked quantity during the period
  SELECT MAX(daily_booked) INTO v_max_booked
  FROM (
    SELECT COUNT(*) as daily_booked
    FROM booking_items bi
    JOIN bookings b ON bi.booking_id = b.id
    WHERE bi.product_id = v_product_id
    AND b.status IN ('confirmed', 'pending')
    AND (
      (bi.reserved_from <= p_end_date AND bi.reserved_to >= p_start_date)
    )
    GROUP BY bi.reserved_from
  ) daily_bookings;
  
  v_max_booked := COALESCE(v_max_booked, 0);
  v_available := v_total_quantity - v_max_booked;
  
  -- Find conflicting dates
  SELECT ARRAY_AGG(DISTINCT generate_series(bi.reserved_from, bi.reserved_to, '1 day'::interval)::DATE)
  INTO v_conflicts
  FROM booking_items bi
  JOIN bookings b ON bi.booking_id = b.id
  WHERE bi.product_id = v_product_id
  AND b.status IN ('confirmed', 'pending')
  AND (bi.reserved_from <= p_end_date AND bi.reserved_to >= p_start_date)
  AND v_available < p_quantity_needed;
  
  RETURN QUERY SELECT 
    v_available >= p_quantity_needed,
    v_available,
    p_quantity_needed,
    COALESCE(v_conflicts, ARRAY[]::DATE[]);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- FUNCTION: Suggest Alternative Dates
-- ==========================================
CREATE OR REPLACE FUNCTION suggest_alternative_dates(
  p_product_name VARCHAR,
  p_preferred_date DATE,
  p_duration_days INTEGER DEFAULT 1,
  p_quantity_needed INTEGER DEFAULT 1,
  p_days_to_search INTEGER DEFAULT 30
)
RETURNS TABLE (
  suggested_start_date DATE,
  suggested_end_date DATE,
  quantity_available INTEGER,
  days_from_preferred INTEGER
) AS $$
DECLARE
  v_product_id UUID;
  v_total_quantity INTEGER;
  v_current_date DATE;
  v_end_date DATE;
  v_available INTEGER;
  v_date_range DATE[];
BEGIN
  -- Get product
  SELECT id, quantity_total INTO v_product_id, v_total_quantity
  FROM products
  WHERE LOWER(name) = LOWER(p_product_name);
  
  IF v_product_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Search for available dates
  FOR i IN 0..p_days_to_search LOOP
    v_current_date := p_preferred_date + i;
    v_end_date := v_current_date + p_duration_days;
    
    -- Check availability for this period
    SELECT check_product_availability.quantity_available
    INTO v_available
    FROM check_product_availability(p_product_name, v_current_date, v_end_date, p_quantity_needed);
    
    IF v_available >= p_quantity_needed THEN
      RETURN QUERY SELECT 
        v_current_date,
        v_end_date,
        v_available,
        i;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- FUNCTION: Reserve Products for Booking
-- ==========================================
CREATE OR REPLACE FUNCTION reserve_products_for_booking(
  p_booking_id UUID,
  p_products JSONB -- [{"name": "Partytält 4x8m", "quantity": 2, "is_wrapped": false}]
)
RETURNS JSONB AS $$
DECLARE
  v_product JSONB;
  v_product_id UUID;
  v_start_date DATE;
  v_end_date DATE;
  v_available INTEGER;
  v_results JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- Get booking dates
  SELECT delivery_date, pickup_date INTO v_start_date, v_end_date
  FROM bookings WHERE id = p_booking_id;
  
  -- Process each product
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    -- Get product ID
    SELECT id INTO v_product_id
    FROM products
    WHERE LOWER(name) = LOWER(v_product->>'name');
    
    IF v_product_id IS NULL THEN
      v_result := jsonb_build_object(
        'product_name', v_product->>'name',
        'success', false,
        'error', 'Product not found'
      );
      v_results := v_results || v_result;
      CONTINUE;
    END IF;
    
    -- Check availability
    SELECT check_product_availability.quantity_available INTO v_available
    FROM check_product_availability(
      v_product->>'name',
      v_start_date,
      v_end_date,
      (v_product->>'quantity')::INTEGER
    );
    
    IF v_available < (v_product->>'quantity')::INTEGER THEN
      v_result := jsonb_build_object(
        'product_name', v_product->>'name',
        'success', false,
        'error', 'Not enough quantity available',
        'requested', (v_product->>'quantity')::INTEGER,
        'available', v_available
      );
      v_results := v_results || v_result;
      CONTINUE;
    END IF;
    
    -- Reserve product
    INSERT INTO booking_items (
      booking_id,
      product_id,
      quantity,
      reserved_from,
      reserved_to,
      is_wrapped
    ) VALUES (
      p_booking_id,
      v_product_id,
      (v_product->>'quantity')::INTEGER,
      v_start_date,
      v_end_date,
      COALESCE((v_product->>'is_wrapped')::BOOLEAN, false)
    );
    
    v_result := jsonb_build_object(
      'product_name', v_product->>'name',
      'success', true,
      'quantity', (v_product->>'quantity')::INTEGER
    );
    v_results := v_results || v_result;
  END LOOP;
  
  RETURN v_results;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Insert Sample Products
-- ==========================================
INSERT INTO products (name, category, description, base_price_per_day, quantity_total, can_be_wrapped, wrapping_cost) VALUES
('Partytält 3x3m', 'tält', 'Mindre partytält perfekt för upp till 15 personer', 1200, 5, false, 0),
('Partytält 4x4m', 'tält', 'Mellanstort tält för upp till 25 personer', 1800, 3, false, 0),
('Partytält 4x8m', 'tält', 'Större tält för upp till 50 personer', 2500, 4, false, 0),
('Partytält 6x12m', 'tält', 'Stort festtält för upp till 100 personer', 5500, 2, false, 0),
('Bord 180cm', 'möbler', 'Standardbord, plats för 6-8 personer', 150, 20, false, 0),
('Stol vit', 'möbler', 'Vit plaststol', 45, 100, false, 0),
('Golv trä (per kvm)', 'golv', 'Trägolv för tält', 85, 200, false, 0),
('Värmepump 9kW', 'värme', 'Värmepump för tält upp till 50 kvm', 450, 8, true, 2500),
('Lysrör LED', 'belysning', 'LED-belysning', 120, 30, false, 0),
('Grillstation', 'utrustning', 'Professionell grillstation', 800, 3, true, 3500)
ON CONFLICT (name) DO NOTHING;

-- Create inventory items for each product
INSERT INTO inventory_items (product_id, item_number, status)
SELECT 
  p.id,
  p.category || '-' || LPAD(generate_series::TEXT, 3, '0'),
  'available'
FROM products p
CROSS JOIN generate_series(1, (SELECT quantity_total FROM products WHERE id = p.id))
ON CONFLICT (item_number) DO NOTHING;

COMMENT ON TABLE products IS 'Produktkatalog - alla produkter som kan hyras';
COMMENT ON TABLE inventory_items IS 'Specifika lagerartiklar - varje fysisk enhet';
COMMENT ON TABLE booking_items IS 'Reservation av specifika artiklar för bokningar';
COMMENT ON TABLE availability_calendar IS 'Snabb uppslagstabell för tillgänglighet';
COMMENT ON FUNCTION check_product_availability IS 'Kontrollera om en produkt är tillgänglig för ett datum-intervall';
COMMENT ON FUNCTION suggest_alternative_dates IS 'Föreslå alternativa datum om produkten är upptagen';
COMMENT ON FUNCTION reserve_products_for_booking IS 'Reservera produkter för en bokning';

