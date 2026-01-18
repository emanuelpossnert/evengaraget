-- ============================================
-- CALENDAR CATEGORY COLORS - DATABASE SETUP
-- ============================================

-- Create category_colors table
CREATE TABLE IF NOT EXISTS public.category_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) UNIQUE NOT NULL,
  color_bg VARCHAR(50) NOT NULL,          -- bg-red-100, bg-blue-100, etc
  color_text VARCHAR(50) NOT NULL,        -- text-red-700, text-blue-700, etc
  color_border VARCHAR(50) NOT NULL,      -- border-red-300, border-blue-300, etc
  hex_color VARCHAR(7),                   -- #FF0000 for reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now
ALTER TABLE IF EXISTS category_colors DISABLE ROW LEVEL SECURITY;

-- Insert default category colors
INSERT INTO public.category_colors (category, color_bg, color_text, color_border, hex_color)
VALUES 
  ('Tält', 'bg-blue-100', 'text-blue-700', 'border-blue-300', '#3B82F6'),
  ('Möbler', 'bg-purple-100', 'text-purple-700', 'border-purple-300', '#A855F7'),
  ('Grill', 'bg-red-100', 'text-red-700', 'border-red-300', '#EF4444'),
  ('Belysning', 'bg-yellow-100', 'text-yellow-700', 'border-yellow-300', '#EAB308'),
  ('Värme', 'bg-orange-100', 'text-orange-700', 'border-orange-300', '#F97316'),
  ('Övrigt', 'bg-gray-100', 'text-gray-700', 'border-gray-300', '#6B7280')
ON CONFLICT (category) DO NOTHING;

-- Verify
SELECT * FROM category_colors ORDER BY category;

