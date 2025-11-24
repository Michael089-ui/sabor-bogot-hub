-- Agregar campos para precio en COP y descripción detallada
ALTER TABLE restaurant_cache 
ADD COLUMN IF NOT EXISTS min_price INTEGER,
ADD COLUMN IF NOT EXISTS max_price INTEGER,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'COP',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS cuisine TEXT;

-- Crear índices para mejorar búsqueda por precio y barrio
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_price_level ON restaurant_cache(price_level);
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_neighborhood ON restaurant_cache(neighborhood);
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_min_price ON restaurant_cache(min_price);
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_cuisine ON restaurant_cache(cuisine);

-- Comentarios para documentación
COMMENT ON COLUMN restaurant_cache.min_price IS 'Precio mínimo en COP por persona';
COMMENT ON COLUMN restaurant_cache.max_price IS 'Precio máximo en COP por persona';
COMMENT ON COLUMN restaurant_cache.currency IS 'Código de moneda ISO 4217';
COMMENT ON COLUMN restaurant_cache.description IS 'Descripción detallada del restaurante';
COMMENT ON COLUMN restaurant_cache.cuisine IS 'Tipo de cocina principal del restaurante';