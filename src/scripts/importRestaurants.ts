import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

interface CSVRestaurant {
  place_id: string;
  name: string;
  rating: string;
  address: string;
  zone: string;
  price_level: string;
  latitude: string;
  longitude: string;
  cuisine: string;
  description: string;
  min_price: string;
  max_price: string;
  currency: string;
  price_range: string;
  last_updated: string;
}

export const parseCSV = (csvText: string): CSVRestaurant[] => {
  const result = Papa.parse<CSVRestaurant>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });
  
  return result.data;
};

export const transformRestaurantData = (csvRestaurant: CSVRestaurant) => {
  const rating = parseFloat(csvRestaurant.rating);
  const priceLevel = parseInt(csvRestaurant.price_level);
  
  return {
    place_id: csvRestaurant.place_id,
    name: csvRestaurant.name,
    formatted_address: csvRestaurant.address,
    neighborhood: csvRestaurant.zone,
    rating: isNaN(rating) ? null : rating,
    user_ratings_total: isNaN(rating) ? 0 : Math.round(rating * 100),
    price_level: priceLevel.toString(),
    location: {
      lat: parseFloat(csvRestaurant.latitude),
      lng: parseFloat(csvRestaurant.longitude)
    },
    types: csvRestaurant.cuisine.split('/').map(t => t.trim()),
    cuisine: csvRestaurant.cuisine,
    description: csvRestaurant.description,
    min_price: parseInt(csvRestaurant.min_price),
    max_price: parseInt(csvRestaurant.max_price),
    currency: csvRestaurant.currency,
    photos: null,
    open_now: null,
    opening_hours: null,
    phone_number: null,
    website: null,
    search_query: null,
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  };
};

export const importRestaurants = async (csvText: string) => {
  try {
    const csvRestaurants = parseCSV(csvText);
    const transformedData = csvRestaurants.map(transformRestaurantData);
    
    const { data, error } = await supabase
      .from('restaurant_cache')
      .upsert(transformedData, { onConflict: 'place_id' });
    
    if (error) throw error;
    
    return {
      success: true,
      count: transformedData.length,
      message: `${transformedData.length} restaurantes importados exitosamente`
    };
  } catch (error) {
    console.error('Error importing restaurants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};
