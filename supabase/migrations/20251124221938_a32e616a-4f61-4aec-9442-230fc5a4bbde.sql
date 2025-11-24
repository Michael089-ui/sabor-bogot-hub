-- Limpiar restaurantes que no son de Bogotá, Colombia
DELETE FROM restaurant_cache 
WHERE (formatted_address NOT ILIKE '%Bogotá%' 
   AND formatted_address NOT ILIKE '%Colombia%') 
   OR formatted_address ILIKE '%EE. UU.%' 
   OR formatted_address ILIKE '%USA%'
   OR formatted_address ILIKE '%United States%';