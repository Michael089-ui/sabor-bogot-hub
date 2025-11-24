import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoverRequest {
  neighborhood: string;
  location: { lat: number; lng: number };
  radius?: number;
  types?: string[];
  minRating?: number;
  maxResults?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      neighborhood, 
      location, 
      radius = 2000,
      types = ['restaurant', 'cafe', 'bar'],
      minRating = 4.0,
      maxResults = 20
    }: DiscoverRequest = await req.json();

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GOOGLE_MAPS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Searching for places in ${neighborhood}...`);

    // Text Search usando Places API (New)
    const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.currentOpeningHours,places.photos,places.nationalPhoneNumber,places.websiteUri'
      },
      body: JSON.stringify({
        textQuery: `restaurantes en ${neighborhood}, Bogotá, Colombia`,
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        },
        maxResultCount: maxResults,
        includedType: 'restaurant'
      })
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error('Places API error:', error);
      throw new Error(`Places API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const places = searchData.places || [];

    console.log(`Found ${places.length} places`);

    const results = {
      discovered: 0,
      updated: 0,
      new: 0,
      errors: [] as string[],
      restaurants: [] as any[]
    };

    // Procesar cada lugar
    for (const place of places) {
      try {
        // Filtrar por rating mínimo
        if (place.rating && place.rating < minRating) {
          continue;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

        // Preparar datos del restaurante
        const restaurantData = {
          place_id: place.id,
          name: place.displayName?.text || 'Sin nombre',
          formatted_address: place.formattedAddress || '',
          neighborhood: neighborhood,
          rating: place.rating || null,
          user_ratings_total: place.userRatingCount || 0,
          price_level: place.priceLevel || null,
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0
          },
          types: place.types || [],
          cuisine: null,
          description: null,
          min_price: null,
          max_price: null,
          currency: 'COP',
          // Procesar fotos
          photos: place.photos ? place.photos.map((photo: any) => ({
            photo_reference: photo.name
          })) : null,
          open_now: place.currentOpeningHours?.openNow || null,
          opening_hours: place.currentOpeningHours ? {
            weekday_text: place.currentOpeningHours.weekdayDescriptions || []
          } : null,
          phone_number: place.nationalPhoneNumber || null,
          website: place.websiteUri || null,
          search_query: `API:${neighborhood}`,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        };

        // Verificar si existe
        const { data: existing } = await supabase
          .from('restaurant_cache')
          .select('id')
          .eq('place_id', place.id)
          .single();

        if (existing) {
          // Actualizar existente
          const { error: updateError } = await supabase
            .from('restaurant_cache')
            .update(restaurantData)
            .eq('place_id', place.id);

          if (updateError) throw updateError;
          results.updated++;
        } else {
          // Insertar nuevo
          const { error: insertError } = await supabase
            .from('restaurant_cache')
            .insert(restaurantData);

          if (insertError) throw insertError;
          results.new++;
        }

        results.discovered++;
        results.restaurants.push({
          name: restaurantData.name,
          rating: restaurantData.rating,
          photos: restaurantData.photos?.length || 0
        });

        console.log(`✅ ${existing ? 'Updated' : 'Added'}: ${restaurantData.name} (${restaurantData.rating}⭐, ${restaurantData.photos?.length || 0} fotos)`);

      } catch (error) {
        const errorMsg = `Error processing ${place.displayName?.text}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in discover-restaurants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      discovered: 0,
      updated: 0,
      new: 0,
      errors: [errorMessage]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
