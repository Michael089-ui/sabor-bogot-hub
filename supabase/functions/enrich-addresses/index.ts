import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Obtener restaurantes con direcciones ambiguas o coordenadas pero sin dirección detallada
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurant_cache')
      .select('*')
      .not('location', 'is', null)
      .limit(100);

    if (fetchError) throw fetchError;

    console.log(`Processing ${restaurants?.length || 0} restaurants`);

    let enrichedCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurants || []) {
      try {
        const { lat, lng } = restaurant.location;
        
        // 1. Usar Geocoding API para obtener dirección precisa
        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${GOOGLE_MAPS_API_KEY}`;
        const geocodingResponse = await fetch(geocodingUrl);
        const geocodingData = await geocodingResponse.json();

        if (geocodingData.status !== 'OK' || !geocodingData.results?.[0]) {
          console.error(`Geocoding failed for ${restaurant.name}:`, geocodingData.status);
          errorCount++;
          continue;
        }

        const addressComponents = geocodingData.results[0].address_components;
        const formattedAddress = geocodingData.results[0].formatted_address;

        // Extraer componentes específicos de la dirección
        const neighborhood = addressComponents.find((c: any) => 
          c.types.includes('sublocality') || c.types.includes('neighborhood')
        )?.long_name;

        const route = addressComponents.find((c: any) => 
          c.types.includes('route')
        )?.long_name;

        const streetNumber = addressComponents.find((c: any) => 
          c.types.includes('street_number')
        )?.long_name;

        // 2. Obtener detalles adicionales de Place Details API si tenemos place_id
        let placeDetails = null;
        if (restaurant.place_id) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${restaurant.place_id}&fields=formatted_address,address_components,geometry,name,photos,rating,user_ratings_total,price_level,types,opening_hours,formatted_phone_number,website,business_status&language=es&key=${GOOGLE_MAPS_API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === 'OK') {
            placeDetails = detailsData.result;
          }
        }

        // Construir dirección mejorada
        let improvedAddress = formattedAddress;
        if (streetNumber && route) {
          improvedAddress = `${route} ${streetNumber}, ${neighborhood || 'Bogotá'}, Bogotá`;
        }

        // Preparar datos de actualización
        const updateData: any = {
          formatted_address: placeDetails?.formatted_address || improvedAddress,
          neighborhood: neighborhood || restaurant.neighborhood,
        };

        // Actualizar fotos si están disponibles en Place Details
        if (placeDetails?.photos && placeDetails.photos.length > 0) {
          updateData.photos = placeDetails.photos.slice(0, 5).map((photo: any) => photo.photo_reference);
        }

        // Actualizar otros campos si están disponibles
        if (placeDetails?.opening_hours?.weekday_text) {
          updateData.opening_hours = placeDetails.opening_hours.weekday_text;
          updateData.open_now = placeDetails.opening_hours.open_now || false;
        }

        if (placeDetails?.formatted_phone_number) {
          updateData.phone_number = placeDetails.formatted_phone_number;
        }

        if (placeDetails?.website) {
          updateData.website = placeDetails.website;
        }

        if (placeDetails?.rating) {
          updateData.rating = placeDetails.rating;
        }

        if (placeDetails?.user_ratings_total) {
          updateData.user_ratings_total = placeDetails.user_ratings_total;
        }

        if (placeDetails?.price_level) {
          updateData.price_level = placeDetails.price_level.toString();
        }

        if (placeDetails?.types) {
          updateData.types = placeDetails.types;
        }

        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('restaurant_cache')
          .update(updateData)
          .eq('id', restaurant.id);

        if (updateError) {
          console.error(`Error updating ${restaurant.name}:`, updateError);
          errorCount++;
        } else {
          enrichedCount++;
          console.log(`✅ Enriched: ${restaurant.name}`);
        }

        // Pequeño delay para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing ${restaurant.name}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        enriched: enrichedCount,
        errors: errorCount,
        total: restaurants?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enrich addresses error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
