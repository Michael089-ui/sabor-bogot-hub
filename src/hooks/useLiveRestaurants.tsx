import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LiveRestaurant {
  id: string;
  place_id: string;
  name: string;
  formatted_address: string | null;
  neighborhood: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  price_level: string | null;
  photos: any;
  location: any;
  types: string[] | null;
  open_now: boolean | null;
  opening_hours: any;
  phone_number: string | null;
  website: string | null;
  min_price?: number | null;
  max_price?: number | null;
  currency?: string | null;
  description?: string | null;
  cuisine?: string | null;
  reviews?: any;
  source?: 'live' | 'cache';
}

export interface LiveSearchFilters {
  cuisine?: string[];
  priceLevel?: string[];
  neighborhood?: string[];
  minRating?: number;
  openNow?: boolean;
}

// Función auxiliar para obtener resultados en vivo
const fetchLiveResults = async (filters?: LiveSearchFilters, limit = 20) => {
  try {
    console.log('🔴 Búsqueda LIVE iniciada con filtros:', filters);

    let searchQuery = "restaurant in Bogotá, Colombia";
    
    if (filters?.cuisine && filters.cuisine.length > 0) {
      searchQuery = `${filters.cuisine[0]} restaurant in Bogotá, Colombia`;
    }

    if (filters?.neighborhood && filters.neighborhood.length > 0) {
      searchQuery = `restaurant in ${filters.neighborhood[0]}, Bogotá, Colombia`;
    }

    const { data: liveData, error: liveError } = await supabase.functions.invoke('places-search', {
      body: { 
        query: searchQuery.replace('restaurant', '').trim() || 'restaurant',
        neighborhood: filters?.neighborhood?.[0]
      }
    });

    if (!liveError && liveData?.restaurants && liveData.restaurants.length > 0) {
      console.log(`✅ LIVE: ${liveData.restaurants.length} restaurantes encontrados`);
      
      const liveRestaurants = liveData.restaurants.map((r: any) => ({
        ...r,
        source: 'live' as const
      }));

      let filtered = liveRestaurants;

      if (filters?.priceLevel && filters.priceLevel.length > 0) {
        filtered = filtered.filter((r: any) => 
          filters.priceLevel?.includes(String(r.price_level))
        );
      }

      if (filters?.minRating) {
        filtered = filtered.filter((r: any) => 
          r.rating && r.rating >= filters.minRating!
        );
      }

      if (filters?.openNow === true) {
        filtered = filtered.filter((r: any) => r.open_now === true);
      }

      return filtered.slice(0, limit);
    }

    throw new Error('No live results');
  } catch (error) {
    console.error('❌ Error en búsqueda LIVE:', error);
    throw error;
  }
};

// Hook para búsqueda en tiempo real con fallback a caché
export const useLiveRestaurants = (filters?: LiveSearchFilters, limit = 20) => {
  return useQuery({
    queryKey: ["live-restaurants", filters, limit],
    queryFn: async () => {
      try {
        const liveResults = await fetchLiveResults(filters, limit);
        return liveResults;
      } catch (error) {
        console.log('⚠️ LIVE falló, usando CACHÉ como fallback');
        return await fetchFromCache(filters, limit);
      }
    },
    staleTime: 1000 * 60,
  });
};

// Función auxiliar para obtener del caché
const fetchFromCache = async (filters?: LiveSearchFilters, limit?: number) => {
  let query = supabase
    .from("restaurant_cache")
    .select("*")
    .or('formatted_address.ilike.%Bogotá%,formatted_address.ilike.%Colombia%');

  if (filters?.cuisine && filters.cuisine.length > 0) {
    query = query.or(filters.cuisine.map(c => `cuisine.ilike.%${c}%`).join(','));
  }

  if (filters?.priceLevel && filters.priceLevel.length > 0) {
    query = query.in("price_level", filters.priceLevel);
  }

  if (filters?.neighborhood && filters.neighborhood.length > 0) {
    query = query.or(filters.neighborhood.map(n => `neighborhood.eq.${n}`).join(','));
  }

  if (filters?.minRating) {
    query = query.gte("rating", filters.minRating);
  }

  if (filters?.openNow === true) {
    query = query.eq("open_now", true);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Marcar como fuente 'cache'
  return (data || []).map(r => ({
    ...r,
    source: 'cache' as const
  }));
};

// Hook para scroll infinito con estrategia híbrida
export const useInfiniteLiveRestaurants = (filters?: LiveSearchFilters, pageSize = 12) => {
  return useInfiniteQuery({
    queryKey: ["live-restaurants-infinite", filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      // Para la primera página, intentar LIVE
      if (pageParam === 0) {
        try {
          const liveResults = await fetchLiveResults(filters, pageSize);
          
          if (liveResults && liveResults.length > 0) {
            return {
              data: liveResults,
              nextCursor: liveResults.length >= pageSize ? pageSize : undefined,
              totalCount: liveResults.length,
              source: 'live' as const
            };
          }
        } catch (error) {
          console.log('Live search failed, using cache');
        }
      }

      // Para páginas siguientes o si LIVE falla, usar caché
      let query = supabase
        .from("restaurant_cache")
        .select("*", { count: 'exact' })
        .or('formatted_address.ilike.%Bogotá%,formatted_address.ilike.%Colombia%');

      if (filters?.cuisine && filters.cuisine.length > 0) {
        query = query.or(filters.cuisine.map(c => `cuisine.ilike.%${c}%`).join(','));
      }

      if (filters?.priceLevel && filters.priceLevel.length > 0) {
        query = query.in("price_level", filters.priceLevel);
      }

      if (filters?.neighborhood && filters.neighborhood.length > 0) {
        query = query.or(filters.neighborhood.map(n => `neighborhood.eq.${n}`).join(','));
      }

      if (filters?.minRating) {
        query = query.gte("rating", filters.minRating);
      }

      if (filters?.openNow === true) {
        query = query.eq("open_now", true);
      }

      const { data, error, count } = await query.range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;
      
      return {
        data: (data || []).map(r => ({ ...r, source: 'cache' as const })),
        nextCursor: data && data.length >= pageSize ? pageParam + pageSize : undefined,
        totalCount: count || 0,
        source: 'cache' as const
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};
