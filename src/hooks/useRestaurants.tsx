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
  min_price?: number | null;
  max_price?: number | null;
  currency?: string | null;
  description?: string | null;
  cuisine?: string | null;
  reviews?: any;
}

export interface PriceInfo {
  symbols: string;
  label: string;
  range: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  avgPrice: number;
}

export interface RestaurantFilters {
  cuisine?: string[];
  priceLevel?: string[];
  neighborhood?: string[];
  minRating?: number;
  openNow?: boolean;
}

export const useRestaurants = (limit?: number, filters?: RestaurantFilters) => {
  return useQuery({
    queryKey: ["restaurants", limit, filters],
    queryFn: async () => {
      let query = supabase
        .from("restaurant_cache")
        .select("*")
        .order("rating", { ascending: false, nullsFirst: false });

      // Aplicar filtros
      if (filters?.cuisine && filters.cuisine.length > 0) {
        query = query.or(filters.cuisine.map(c => `cuisine.ilike.%${c}%`).join(','));
      }

      if (filters?.priceLevel && filters.priceLevel.length > 0) {
        query = query.in("price_level", filters.priceLevel);
      }

      if (filters?.neighborhood && filters.neighborhood.length > 0) {
        query = query.in("neighborhood", filters.neighborhood);
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
export const getPhotoUrl = (photoReference: string | { photo_reference: string } | any, maxWidth = 800) => {
  // Si es un objeto, extraer la propiedad photo_reference
  let reference: string;
  if (typeof photoReference === 'object' && photoReference !== null) {
    reference = photoReference.photo_reference || photoReference.name || '';
  } else {
    reference = photoReference || '';
  }

  if (!reference) return '';

  // Si ya es una URL completa, devolverla directamente
  if (reference.startsWith('http')) {
    return reference;
  }
  // Si es una referencia de Places API (New) format: places/PLACE_ID/photos/PHOTO_ID
  if (reference.includes('places/')) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://places.googleapis.com/v1/${reference}/media?key=${apiKey}&maxWidthPx=${maxWidth}`;
  }
  // Fallback para referencias antiguas
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${reference}&key=${apiKey}`;
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
    "1": "$",
    "2": "$$",
    "3": "$$$",
    "4": "$$$$",
  };
  return levels[priceLevel] || priceLevel;
};

// Helper para formatear moneda COP
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper para obtener símbolos de precio
const getPriceSymbols = (priceLevel: string | null): string => {
  if (!priceLevel) return "$";
  const levels: { [key: string]: string } = {
    "1": "$", "2": "$$", "3": "$$$", "4": "$$$$"
  };
  return levels[priceLevel] || "$$";
};

// Helper para obtener etiqueta de precio
const getPriceLabel = (priceLevel: string | null): string => {
  if (!priceLevel) return "Moderado";
  const labels: { [key: string]: string } = {
    "1": "Económico",
    "2": "Moderado",
    "3": "Costoso",
    "4": "Muy Costoso"
  };
  return labels[priceLevel] || "Moderado";
};

// Helper para obtener información genérica de precio
const getGenericPriceInfo = (priceLevel: string | null): PriceInfo => {
  const level = priceLevel || "2";
  const ranges: { [key: string]: PriceInfo } = {
    "1": {
      symbols: "$",
      label: "Económico",
      range: "$10.000 - $25.000",
      minPrice: 10000,
      maxPrice: 25000,
      currency: "COP",
      avgPrice: 17500
    },
    "2": {
      symbols: "$$",
      label: "Moderado",
      range: "$25.000 - $50.000",
      minPrice: 25000,
      maxPrice: 50000,
      currency: "COP",
      avgPrice: 37500
    },
    "3": {
      symbols: "$$$",
      label: "Costoso",
      range: "$50.000 - $100.000",
      minPrice: 50000,
      maxPrice: 100000,
      currency: "COP",
      avgPrice: 75000
    },
    "4": {
      symbols: "$$$$",
      label: "Muy Costoso",
      range: "$100.000+",
      minPrice: 100000,
      maxPrice: 300000,
      currency: "COP",
      avgPrice: 150000
    }
  };
  return ranges[level] || ranges["2"];
};

// Helper principal para obtener información de precio
export const getPriceInfo = (restaurant: Restaurant): PriceInfo => {
  // Si tiene min/max price, usar esos valores reales
  if (restaurant.min_price && restaurant.max_price) {
    return {
      symbols: getPriceSymbols(restaurant.price_level),
      label: getPriceLabel(restaurant.price_level),
      range: `${formatCurrency(restaurant.min_price)} - ${formatCurrency(restaurant.max_price)}`,
      minPrice: restaurant.min_price,
      maxPrice: restaurant.max_price,
      currency: restaurant.currency || 'COP',
      avgPrice: Math.round((restaurant.min_price + restaurant.max_price) / 2)
    };
  }
  
  // Fallback a rangos genéricos por price_level
  return getGenericPriceInfo(restaurant.price_level);
};
