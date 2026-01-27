-- ============================================================================
-- COMPREHENSIVE ADDONS FIX - Link all addons to products
-- ============================================================================

-- 1. First, ensure product_id column exists
ALTER TABLE IF EXISTS public.addons
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

-- 2. Create index if not exists
CREATE INDEX IF NOT EXISTS idx_addons_product_id ON public.addons(product_id);

-- 3. Link addons to products based on name/category matching
-- Strategy: Match addon names/categories to product names

-- For "Grillkol" - link to any grill-related product
UPDATE public.addons
SET product_id = (
  SELECT id FROM public.products 
  WHERE LOWER(name) LIKE '%grill%'
  LIMIT 1
)
WHERE LOWER(name) LIKE '%grill%' AND product_id IS NULL;

-- For "Värmefläkt" and other heat-related - link to tent/marquee products
UPDATE public.addons
SET product_id = (
  SELECT id FROM public.products 
  WHERE LOWER(name) LIKE '%tält%' OR LOWER(name) LIKE '%marquee%'
  LIMIT 1
)
WHERE (LOWER(name) LIKE '%värmefläkt%' OR LOWER(category) LIKE '%klimat%') AND product_id IS NULL;

-- For "LED-belysning" and lighting - link to tent/marquee
UPDATE public.addons
SET product_id = (
  SELECT id FROM public.products 
  WHERE LOWER(name) LIKE '%tält%' OR LOWER(name) LIKE '%marquee%'
  LIMIT 1
)
WHERE (LOWER(name) LIKE '%led%' OR LOWER(name) LIKE '%belysning%' OR LOWER(category) LIKE '%belysning%') 
  AND product_id IS NULL;

-- For Popcorn-related addons - link to Popcornvagn products
UPDATE public.addons
SET product_id = (
  SELECT id FROM public.products 
  WHERE LOWER(name) LIKE '%popcorn%'
  LIMIT 1
)
WHERE (LOWER(name) LIKE '%popcorn%' OR LOWER(category) LIKE '%consumables%') AND product_id IS NULL;

-- For Branding/Foliering - link to first available product
UPDATE public.addons
SET product_id = (
  SELECT id FROM public.products 
  LIMIT 1
)
WHERE (LOWER(category) LIKE '%branding%' OR LOWER(name) LIKE '%foliering%') AND product_id IS NULL;

-- For electrical/power - link to first available product
UPDATE public.addons
SET product_id = (
  SELECT id FROM public.products 
  LIMIT 1
)
WHERE LOWER(category) LIKE '%electrical%' AND product_id IS NULL;

-- For service addons - link to first available product
UPDATE public.addons
SET product_id = (
  SELECT id FROM public.products 
  LIMIT 1
)
WHERE LOWER(category) LIKE '%service%' AND product_id IS NULL;

-- 4. If there are still NULL product_ids, assign to first product (as fallback)
UPDATE public.addons
SET product_id = (
  SELECT id FROM public.products 
  LIMIT 1
)
WHERE product_id IS NULL;

-- 5. Verify results
SELECT 
  'Total addons' as check_type,
  COUNT(*) as count
FROM public.addons

UNION ALL

SELECT 
  'Addons with product_id' as check_type,
  COUNT(*) as count
FROM public.addons
WHERE product_id IS NOT NULL

UNION ALL

SELECT 
  'Addons WITHOUT product_id' as check_type,
  COUNT(*) as count
FROM public.addons
WHERE product_id IS NULL;

-- 6. Show addon distribution by product
SELECT 
  p.name as product_name,
  COUNT(a.id) as addon_count
FROM public.products p
LEFT JOIN public.addons a ON a.product_id = p.id
GROUP BY p.id, p.name
ORDER BY addon_count DESC;

-- 7. Show sample addons with their product links
SELECT 
  a.id,
  a.name as addon_name,
  a.category,
  a.price,
  p.name as product_name
FROM public.addons a
LEFT JOIN public.products p ON a.product_id = p.id
ORDER BY a.name
LIMIT 20;
