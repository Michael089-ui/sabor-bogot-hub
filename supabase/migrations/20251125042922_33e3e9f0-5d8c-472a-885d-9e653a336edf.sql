-- Create optimized indexes for restaurant_cache table to speed up queries

-- Index for neighborhood searches
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_neighborhood 
ON restaurant_cache(neighborhood) 
WHERE neighborhood IS NOT NULL;

-- Index for cuisine type searches
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_cuisine 
ON restaurant_cache(cuisine) 
WHERE cuisine IS NOT NULL;

-- Index for rating-based sorting (DESC for highest first)
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_rating 
ON restaurant_cache(rating DESC NULLS LAST);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_neighborhood_cuisine 
ON restaurant_cache(neighborhood, cuisine) 
WHERE neighborhood IS NOT NULL AND cuisine IS NOT NULL;

-- Full-text search index for restaurant names (Spanish language)
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_name_search 
ON restaurant_cache USING gin(to_tsvector('spanish', name));

-- Index for open_now status
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_open_now 
ON restaurant_cache(open_now) 
WHERE open_now IS NOT NULL;

-- Index for price_level filtering
CREATE INDEX IF NOT EXISTS idx_restaurant_cache_price_level 
ON restaurant_cache(price_level) 
WHERE price_level IS NOT NULL;