-- ============================================================================
-- IMPORT ALL ADDONS/EXTRAS FOR PRODUCTS
-- Branding, Batteri, Generator, Foliering, etc.
-- ============================================================================

-- Insert all addons
INSERT INTO addons (name, description, price, category)
VALUES
-- BRANDING OPTIONS
('Helfoliering', 'Komplett helfoliering av fordon - 65000 SEK', 65000, 'branding'),
('Enfargsfoliering', 'Enfargsfoliering av fordon - 40000 SEK', 40000, 'branding'),
('Magnetskyltar', 'Magnetiska skyltar för branding - 7500 SEK', 7500, 'branding'),
('Branding Skyltar', 'Branding skyltar - 3500 SEK', 3500, 'branding'),
('Branding Foliering', 'Branding foliering - 5500-6800 SEK', 6000, 'branding'),
('Toppskylt', 'Toppskylt för fordon - 2500 SEK', 2500, 'branding'),

-- MARKIS/TÄLT OPTIONS
('Markis Enfärg', 'Enfärgad markis - 3800 SEK', 3800, 'tent'),
('Markis med Tryck', 'Markis med tryck/branding - 7500 SEK', 7500, 'tent'),
('Markistop', 'Markistop för cykel - 3500 SEK', 3500, 'tent'),

-- ELEKTRISKA EXTRAS
('Batteri per dag', 'Batteri för elektrisk drift - 750 SEK per dag', 750, 'electrical'),
('Generator', 'Generator för drift - 1000 SEK per dag', 1000, 'electrical'),
('Bränsle', 'Bränsle för generator - 2500 SEK per dag', 2500, 'electrical'),

-- POPCORN & GODIS EXTRAS
('100 portioner Popcorn', '100 portioner popcorn - 400 SEK', 400, 'consumables'),
('Popcornpåsar', 'Popcornpåsar - variable', 0, 'consumables'),
('Godis per kg', 'Godis vikt - 150 SEK per kg', 150, 'consumables'),
('500 godispåsar', '500 godispåsar - 350 SEK', 350, 'consumables'),

-- SETUP & RIGGING
('Setup/Rigging', 'Vi riggar/setuppar maskinen - 4720 SEK', 4720, 'service'),
('Hämta själv', 'Du hämtar maskinen - 3120 SEK rabatt', -3120, 'service')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category;

-- Verify all addons are added
SELECT COUNT(*) as total_addons,
       COUNT(DISTINCT category) as addon_categories
FROM addons
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Verify all addons are added
SELECT COUNT(*) as total_addons,
       COUNT(DISTINCT category) as addon_categories
FROM addons
WHERE created_at >= NOW() - INTERVAL '1 minute';
