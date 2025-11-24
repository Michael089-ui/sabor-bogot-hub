import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DataQualityMetrics {
  total: number;
  withPhotos: number;
  withDescriptions: number;
  recentlyUpdated: number;
  neighborhoods: number;
  qualityScore: number;
}

interface NeighborhoodCoverage {
  neighborhood: string;
  total: number;
  withPhotos: number;
  withDescriptions: number;
  avgRating: number;
}

export const useDataQuality = () => {
  return useQuery({
    queryKey: ['data-quality'],
    queryFn: async (): Promise<DataQualityMetrics> => {
      const { data, error } = await supabase
        .from('restaurant_cache')
        .select('*');

      if (error) throw error;

      const total = data.length;
      const withPhotos = data.filter(r => r.photos && Array.isArray(r.photos) && r.photos.length > 0).length;
      const withDescriptions = data.filter(r => r.description).length;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyUpdated = data.filter(r => 
        new Date(r.cached_at) > thirtyDaysAgo
      ).length;

      const neighborhoods = new Set(data.map(r => r.neighborhood).filter(Boolean)).size;

      // Calcular score de calidad (0-100)
      const photoScore = (withPhotos / total) * 30;
      const descriptionScore = (withDescriptions / total) * 30;
      const freshnessScore = (recentlyUpdated / total) * 40;
      const qualityScore = Math.round(photoScore + descriptionScore + freshnessScore);

      return {
        total,
        withPhotos,
        withDescriptions,
        recentlyUpdated,
        neighborhoods,
        qualityScore
      };
    }
  });
};

export const useNeighborhoodCoverage = () => {
  return useQuery({
    queryKey: ['neighborhood-coverage'],
    queryFn: async (): Promise<NeighborhoodCoverage[]> => {
      const { data, error } = await supabase
        .from('restaurant_cache')
        .select('*');

      if (error) throw error;

      const byNeighborhood = data.reduce((acc, restaurant) => {
        const neighborhood = restaurant.neighborhood || 'Sin barrio';
        if (!acc[neighborhood]) {
          acc[neighborhood] = [];
        }
        acc[neighborhood].push(restaurant);
        return acc;
      }, {} as Record<string, any[]>);

      return Object.entries(byNeighborhood).map(([neighborhood, restaurants]) => ({
        neighborhood,
        total: restaurants.length,
        withPhotos: restaurants.filter(r => r.photos && Array.isArray(r.photos) && r.photos.length > 0).length,
        withDescriptions: restaurants.filter(r => r.description).length,
        avgRating: restaurants.reduce((sum, r) => sum + (r.rating || 0), 0) / restaurants.length
      })).sort((a, b) => b.total - a.total);
    }
  });
};

export const useDiscoverRestaurants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      neighborhood: string;
      location: { lat: number; lng: number };
      radius?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('discover-restaurants', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['data-quality'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-coverage'] });
      toast.success(`✅ Descubiertos: ${data.discovered} restaurantes (${data.new} nuevos, ${data.updated} actualizados)`);
    },
    onError: (error) => {
      toast.error(`Error al descubrir restaurantes: ${error.message}`);
    }
  });
};

export const useEnrichWithAI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      placeId: string;
      enrichmentType: 'description' | 'classification' | 'all';
    }) => {
      const { data, error } = await supabase.functions.invoke('enrich-with-ai', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-quality'] });
      toast.success('✅ Restaurante enriquecido con IA');
    },
    onError: (error) => {
      toast.error(`Error al enriquecer: ${error.message}`);
    }
  });
};

export const useEnrichAllWithAI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Obtener todos los restaurantes sin descripción
      const { data: restaurants, error: fetchError } = await supabase
        .from('restaurant_cache')
        .select('place_id, name')
        .is('description', null);

      if (fetchError) throw fetchError;

      let enriched = 0;
      let failed = 0;

      for (const restaurant of restaurants) {
        try {
          await supabase.functions.invoke('enrich-with-ai', {
            body: {
              placeId: restaurant.place_id,
              enrichmentType: 'all'
            }
          });
          enriched++;
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to enrich ${restaurant.name}:`, error);
          failed++;
        }
      }

      return { enriched, failed, total: restaurants.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['data-quality'] });
      toast.success(`✅ Enriquecidos: ${data.enriched}/${data.total} restaurantes`);
    },
    onError: (error) => {
      toast.error(`Error al enriquecer: ${error.message}`);
    }
  });
};
