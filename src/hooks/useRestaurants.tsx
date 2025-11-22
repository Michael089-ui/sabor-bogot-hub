import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Restaurant {
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
}

export const useRestaurants = (limit = 20) => {
  return useQuery({
    queryKey: ["restaurants", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_cache")
        .select("*")
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;
      return data as Restaurant[];
    },
  });
};

export const useRestaurantDetail = (placeId: string | undefined) => {
  return useQuery({
    queryKey: ["restaurant", placeId],
    queryFn: async () => {
      if (!placeId) throw new Error("Place ID is required");

      const { data, error } = await supabase
        .from("restaurant_cache")
        .select("*")
        .eq("place_id", placeId)
        .single();

      if (error) throw error;
      return data as Restaurant;
    },
    enabled: !!placeId,
  });
};

// Helper para obtener URL de foto de Google Places
export const getPhotoUrl = (photoReference: string, maxWidth = 400) => {
  const apiKey = "AIzaSyAeFBja7x7CYXTHfZC1D8sZ8RI0RfRLwac";
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
};

// Helper para formatear el precio
export const formatPriceLevel = (priceLevel: string | null) => {
  if (!priceLevel) return "Precio no disponible";
  const levels: { [key: string]: string } = {
    "PRICE_LEVEL_FREE": "Gratis",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
  };
  return levels[priceLevel] || priceLevel;
};
