-- Eliminar restaurantes que NO son de Bogotá, Colombia
DELETE FROM restaurant_cache
WHERE formatted_address NOT ILIKE '%Bogotá%' 
  AND formatted_address NOT ILIKE '%Colombia%';

-- Crear índice para mejorar búsquedas por dirección
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_address 
ON restaurant_cache USING gin(to_tsvector('spanish', formatted_address));