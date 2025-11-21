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
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query, 'in neighborhood:', neighborhood);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check cache first
    if (neighborhood) {
      const { data: cachedResults, error: cacheError } = await supabase
        .from('restaurant_cache')
        .select('*')
        .ilike('search_query', `%${query}%`)
        .eq('neighborhood', neighborhood)
        .gt('expires_at', new Date().toISOString())
        .limit(5);

      if (!cacheError && cachedResults && cachedResults.length > 0) {
        console.log('🎯 Cache HIT - Returning', cachedResults.length, 'cached results');
        return new Response(
          JSON.stringify({ restaurants: cachedResults, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('📡 Cache MISS - Calling Google Places API (New)');

    // Build the text query
    const textQuery = neighborhood 
      ? `${query} restaurant in ${neighborhood} Bogotá`
      : `${query} restaurant in Bogotá`;

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
          maxResultCount: 5
        })
      }
    );

    if (!placesResponse.ok) {
      const errorText = await placesResponse.text();
      console.error('Places API error:', placesResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Places API error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const placesData = await placesResponse.json();
    console.log('Places API returned:', placesData.places?.length || 0, 'results');

    if (!placesData.places || placesData.places.length === 0) {
      return new Response(
        JSON.stringify({ restaurants: [], cached: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform and cache results
    const restaurants = await Promise.all(
      placesData.places.map(async (place: any) => {
        const photoUrls = place.photos?.slice(0, 3).map((photo: any) => 
          `https://places.googleapis.com/v1/${photo.name}/media?key=${GOOGLE_MAPS_API_KEY}&maxWidthPx=800`
        ) || [];

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
          photos: photoUrls,
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractNeighborhood(address: string): string {
  // Extract neighborhood from Bogotá address
  const match = address.match(/,\s*([^,]+),\s*Bogotá/i);
  return match ? match[1].trim() : 'Bogotá';
}
