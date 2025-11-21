-- Crear tabla de caché para restaurantes de Google Places API
CREATE TABLE IF NOT EXISTS restaurant_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text UNIQUE NOT NULL,
  
  -- Datos básicos
  name text NOT NULL,
  formatted_address text,
  location jsonb NOT NULL,
  
  -- Ratings y popularidad
  rating numeric,
  user_ratings_total integer,
  price_level text,
  
  -- Información adicional
  types text[],
  phone_number text,
  website text,
  
  -- Horarios
  opening_hours jsonb,
  open_now boolean,
  
  -- Media
  photos jsonb,
  
  -- Control de caché
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  
  -- Búsqueda
  search_query text,
  neighborhood text
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cache_place_id ON restaurant_cache(place_id);
CREATE INDEX IF NOT EXISTS idx_cache_neighborhood ON restaurant_cache(neighborhood);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON restaurant_cache(expires_at);

-- Habilitar RLS
ALTER TABLE restaurant_cache ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (caché es público)
CREATE POLICY "Permitir lectura pública de caché"
  ON restaurant_cache
  FOR SELECT
  USING (true);

-- Política para permitir escritura desde funciones serverless
CREATE POLICY "Permitir escritura desde service role"
  ON restaurant_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);