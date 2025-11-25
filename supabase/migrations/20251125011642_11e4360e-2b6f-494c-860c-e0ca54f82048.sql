-- Add reviews field to restaurant_cache table for storing Google reviews
ALTER TABLE public.restaurant_cache 
ADD COLUMN IF NOT EXISTS reviews jsonb DEFAULT NULL;

COMMENT ON COLUMN public.restaurant_cache.reviews IS 'Google Maps reviews stored as JSON array';