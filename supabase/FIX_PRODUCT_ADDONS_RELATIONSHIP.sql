-- Fix product_addons foreign key relationship
-- Ensures the foreign key constraint exists between product_addons and addons

-- Drop old foreign key if exists (handle various naming conventions)
ALTER TABLE public.product_addons
DROP CONSTRAINT IF EXISTS product_addons_addon_id_fkey,
DROP CONSTRAINT IF EXISTS product_addons_addon_id_foreign,
DROP CONSTRAINT IF EXISTS fk_product_addons_addon_id;

-- Add the correct foreign key constraint
ALTER TABLE public.product_addons
ADD CONSTRAINT product_addons_addon_id_fkey 
FOREIGN KEY (addon_id) 
REFERENCES public.addons(id) 
ON DELETE CASCADE;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_product_addons_addon_id 
ON public.product_addons(addon_id);

CREATE INDEX IF NOT EXISTS idx_product_addons_product_id 
ON public.product_addons(product_id);

-- Verify the relationship
-- SELECT constraint_name, table_name, column_name 
-- FROM information_schema.key_column_usage 
-- WHERE table_name = 'product_addons';
