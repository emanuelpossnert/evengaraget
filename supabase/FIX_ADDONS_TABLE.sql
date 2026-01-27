-- ============================================================================
-- FIX ADDONS TABLE - Add product_id column and link addons to products
-- ============================================================================

-- 1. Add product_id column if it doesn't exist
ALTER TABLE IF EXISTS public.addons
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_addons_product_id ON public.addons(product_id);

-- 3. Automatically link addons to products based on category and name matching
-- This maps addons to appropriate products

-- Map branding addons to Popcornvagn LITEN (foliering product)
UPDATE public.addons
SET product_id = (SELECT id FROM public.products WHERE LOWER(name) LIKE '%popcorn%' LIMIT 1)
WHERE category = 'branding' 
  AND product_id IS NULL;

-- Map tent/markis addons to Tält products
UPDATE public.addons
SET product_id = (SELECT id FROM public.products WHERE LOWER(name) LIKE '%tält%' LIMIT 1)
WHERE category = 'tent' 
  AND product_id IS NULL;

-- Map electrical addons to products that might use them (general)
UPDATE public.addons
SET product_id = (SELECT id FROM public.products LIMIT 1)
WHERE category = 'electrical' 
  AND product_id IS NULL;

-- Map consumables to Popcornvagn
UPDATE public.addons
SET product_id = (SELECT id FROM public.products WHERE LOWER(name) LIKE '%popcorn%' LIMIT 1)
WHERE category = 'consumables' 
  AND product_id IS NULL;

-- Map service addons to first product
UPDATE public.addons
SET product_id = (SELECT id FROM public.products LIMIT 1)
WHERE category = 'service' 
  AND product_id IS NULL;

-- 4. Verify the changes
SELECT 
  p.name as product_name,
  COUNT(a.id) as addon_count,
  STRING_AGG(a.name, ', ') as addon_names
FROM public.products p
LEFT JOIN public.addons a ON a.product_id = p.id
GROUP BY p.id, p.name
ORDER BY addon_count DESC;

-- Show addons without product_id (if any)
SELECT id, name, category, product_id
FROM public.addons
WHERE product_id IS NULL;
