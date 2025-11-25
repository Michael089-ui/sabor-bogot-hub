import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface PlaceSearchParams {
  query: string;
  location?: { lat: number; lng: number };
  neighborhood?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location, neighborhood }: PlaceSearchParams = await req.json();
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Servicio de búsqueda no disponible',
          details: 'La clave de API de Google Maps no está configurada. Contacta al administrador.',
          restaurants: []
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query, 'in neighborhood:', neighborhood);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // PRIORITY 1: Check cache first - search broadly in restaurant_cache
    let cachedResults = [];
    
    try {
      // Build a comprehensive cache query
      let cacheQuery = supabase
        .from('restaurant_cache')
        .select('*')
        .gt('expires_at', new Date().toISOString());
      
      // Filter by neighborhood if provided
      if (neighborhood) {
        cacheQuery = cacheQuery.ilike('neighborhood', `%${neighborhood}%`);
      }
      
      // Search in multiple fields for better matching
      const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2);
      if (searchTerms.length > 0) {
        cacheQuery = cacheQuery.or(
          searchTerms.map(term => 
            `name.ilike.%${term}%,cuisine.ilike.%${term}%,formatted_address.ilike.%${term}%`
          ).join(',')
        );
      }
      
      const { data, error } = await cacheQuery
        .order('rating', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        cachedResults = data;
        console.log(`🎯 Cache HIT - Found ${cachedResults.length} cached restaurants`);
        
        // If we have enough cached results (5+), return immediately
        if (cachedResults.length >= 5) {
          return new Response(
            JSON.stringify({ 
              restaurants: cachedResults.slice(0, 10), 
              cached: true,
              source: 'database_cache'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (cacheError) {
      console.error('Cache lookup error:', cacheError);
      // Continue to Google API if cache fails
    }

    // PRIORITY 2: If cache has insufficient results, call Google Places API
    console.log(`📡 Cache had ${cachedResults.length} results - Calling Google Places API for more`);


    // Build the text query - SIEMPRE incluir "Bogotá Colombia" para asegurar resultados locales
    const textQuery = neighborhood 
      ? `${query} restaurant in ${neighborhood}, Bogotá, Colombia`
      : `${query} restaurant in Bogotá, Colombia`;

    // Field mask for cost optimization
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.priceLevel',
      'places.types',
      'places.currentOpeningHours',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'places.photos'
    ].join(',');

    // Call Google Places API (New)
    const placesResponse = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': fieldMask
        },
        body: JSON.stringify({
          textQuery,
          languageCode: 'es',
          regionCode: 'CO', // Código de Colombia para priorizar resultados locales
          locationBias: {
            circle: {
              center: {
                latitude: 4.7110, // Centro de Bogotá
                longitude: -74.0721
              },
              radius: 25000.0 // 25km de radio para cubrir toda Bogotá
            }
          },
          maxResultCount: 10 // Incrementar resultados para obtener más opciones
        })
      }
    );

    if (!placesResponse.ok) {
      const errorText = await placesResponse.text();
      console.error('Places API error:', placesResponse.status, errorText);
      
      let errorMessage = 'No se pudieron obtener resultados de búsqueda';
      if (placesResponse.status === 429) {
        errorMessage = 'Límite de búsquedas alcanzado. Intenta en unos minutos.';
      } else if (placesResponse.status === 403) {
        errorMessage = 'Error de autenticación con el servicio de mapas.';
      } else if (placesResponse.status >= 500) {
        errorMessage = 'El servicio de búsqueda está temporalmente no disponible.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `Error ${placesResponse.status}`,
          restaurants: [],
          retryable: placesResponse.status === 429 || placesResponse.status >= 500
        }),
        { status: placesResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const placesData = await placesResponse.json();
    console.log('Places API returned:', placesData.places?.length || 0, 'results');

    if (!placesData.places || placesData.places.length === 0) {
      console.log('⚠️ No se encontraron restaurantes para:', query, 'en', neighborhood);
      return new Response(
        JSON.stringify({ 
          restaurants: [], 
          cached: false,
          message: 'No se encontraron restaurantes que coincidan con tu búsqueda. Intenta con términos diferentes.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform and cache results
    const restaurants = await Promise.all(
      placesData.places.map(async (place: any) => {
        // Guardar referencias de fotos, no URLs completas
        const photoReferences = place.photos?.slice(0, 5).map((photo: any) => photo.name) || [];

        const restaurant = {
          place_id: place.id,
          name: place.displayName?.text || 'Sin nombre',
          formatted_address: place.formattedAddress,
          location: {
            lat: place.location?.latitude,
            lng: place.location?.longitude
          },
          rating: place.rating || 0,
          user_ratings_total: place.userRatingCount || 0,
          price_level: place.priceLevel || 'PRICE_LEVEL_UNSPECIFIED',
          types: place.types || [],
          phone_number: place.internationalPhoneNumber,
          website: place.websiteUri,
          opening_hours: place.currentOpeningHours?.weekdayDescriptions || null,
          open_now: place.currentOpeningHours?.openNow || false,
          photos: photoReferences,
          search_query: query,
          neighborhood: neighborhood || extractNeighborhood(place.formattedAddress)
        };

        // Cache the result
        try {
          await supabase
            .from('restaurant_cache')
            .upsert(restaurant, { onConflict: 'place_id' });
        } catch (error) {
          console.error('Error caching restaurant:', error);
        }

        return restaurant;
      })
    );

    console.log('✅ Returning', restaurants.length, 'restaurants from Places API');

    return new Response(
      JSON.stringify({ restaurants, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Places search error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
    
    return new Response(
      JSON.stringify({ 
        error: isNetworkError
          ? 'Error de conexión al buscar restaurantes. Verifica tu conexión a internet.'
          : 'Ocurrió un error al buscar restaurantes. Por favor intenta nuevamente.',
        details: errorMessage,
        restaurants: [],
        retryable: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractNeighborhood(address: string): string {
  // Extract neighborhood from Bogotá address
  const match = address.match(/,\s*([^,]+),\s*Bogotá/i);
  return match ? match[1].trim() : 'Bogotá';
}
