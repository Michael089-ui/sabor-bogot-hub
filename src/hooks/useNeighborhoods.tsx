import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NeighborhoodOption {
  name: string;
  count: number;
}

export const useNeighborhoods = () => {
  return useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      // Obtener todos los barrios únicos con conteo de restaurantes
      const { data, error } = await supabase
        .from("restaurant_cache")
        .select("neighborhood")
        .not("neighborhood", "is", null)
        .or('formatted_address.ilike.%Bogotá%,formatted_address.ilike.%Colombia%');

      if (error) throw error;

      // Contar ocurrencias de cada barrio
      const neighborhoodCounts = (data as { neighborhood: string }[]).reduce((acc, { neighborhood }) => {
        acc[neighborhood] = (acc[neighborhood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convertir a array y ordenar por conteo descendente
      const neighborhoods: NeighborhoodOption[] = Object.entries(neighborhoodCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return neighborhoods;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
};

export interface CuisineOption {
  name: string;
  displayName: string;
  count: number;
}

export const useCuisines = () => {
  return useQuery({
    queryKey: ["cuisines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_cache")
        .select("cuisine")
        .not("cuisine", "is", null)
        .or('formatted_address.ilike.%Bogotá%,formatted_address.ilike.%Colombia%');

      if (error) throw error;

      // Contar ocurrencias de cada tipo de cocina
      const cuisineCounts = (data as { cuisine: string }[]).reduce((acc, { cuisine }) => {
        acc[cuisine] = (acc[cuisine] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Mapeo de nombres en inglés a español
      const cuisineNames: Record<string, string> = {
        "Colombian": "Colombiana",
        "Italian": "Italiana",
        "Asian": "Asiática",
        "Steakhouse": "Parrilla",
        "Mexican": "Mexicana",
        "Japanese": "Japonesa",
        "Chinese": "China",
        "American": "Americana",
        "French": "Francesa",
        "Mediterranean": "Mediterránea",
        "Seafood": "Mariscos",
        "Pizza": "Pizza",
        "Sushi": "Sushi",
        "Burger": "Hamburguesas",
        "Peruvian": "Peruana",
        "Venezuelan": "Venezolana",
        "Spanish": "Española",
      };

      const cuisines: CuisineOption[] = Object.entries(cuisineCounts)
        .map(([name, count]) => ({ 
          name, 
          displayName: cuisineNames[name] || name,
          count 
        }))
        .sort((a, b) => b.count - a.count);

      return cuisines;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export interface PriceLevelOption {
  level: string;
  displayName: string;
  count: number;
}

export const usePriceLevels = () => {
  return useQuery({
    queryKey: ["priceLevels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_cache")
        .select("price_level")
        .not("price_level", "is", null)
        .or('formatted_address.ilike.%Bogotá%,formatted_address.ilike.%Colombia%');

      if (error) throw error;

      const priceLevelCounts = (data as { price_level: string }[]).reduce((acc, { price_level }) => {
        acc[price_level] = (acc[price_level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priceLabels: Record<string, string> = {
        "1": "$ (Económico)",
        "2": "$$ (Moderado)",
        "3": "$$$ (Caro)",
        "4": "$$$$ (Muy caro)",
      };

      const priceLevels: PriceLevelOption[] = Object.entries(priceLevelCounts)
        .map(([level, count]) => ({ 
          level, 
          displayName: priceLabels[level] || level,
          count 
        }))
        .sort((a, b) => parseInt(a.level) - parseInt(b.level));

      return priceLevels;
    },
    staleTime: 1000 * 60 * 5,
  });
};
