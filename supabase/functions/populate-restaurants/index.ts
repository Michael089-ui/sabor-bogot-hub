import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY no configurado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Iniciando población de restaurantes de Bogotá...');

    // Obtener todas las localidades de Bogotá
    const { data: localidades, error: localidadesError } = await supabase
      .from('localidad')
      .select('nombre')
      .order('numero', { ascending: true });

    if (localidadesError) {
      throw new Error(`Error obteniendo localidades: ${localidadesError.message}`);
    }

    console.log(`📍 Encontradas ${localidades.length} localidades de Bogotá`);

    // Tipos de cocina a buscar
    const cuisineTypes = [
      'Colombian restaurant',
      'Italian restaurant',
      'Asian restaurant',
      'Steakhouse',
      'Mexican restaurant',
      'Japanese restaurant',
      'Chinese restaurant',
      'Seafood restaurant',
      'Pizza restaurant',
      'Burger restaurant',
      'Peruvian restaurant',
      'French restaurant',
      'Spanish restaurant',
      'Mediterranean restaurant',
      'Vegetarian restaurant',
      'Sushi restaurant',
      'Venezuelan restaurant'
    ];

    let totalRestaurants = 0;
    let newRestaurants = 0;
    const errors: string[] = [];

    // Función auxiliar para extraer barrio de dirección
    const extractNeighborhood = (address: string): string => {
      const parts = address.split(',').map(p => p.trim());
      if (parts.length > 1) {
        const secondPart = parts[1];
        if (secondPart && !secondPart.toLowerCase().includes('bogotá')) {
          return secondPart;
        }
      }
      return parts[0] || 'Centro';
    };

    // Mapear cuisine type a nombre corto
    const mapCuisineType = (query: string): string => {
      const mapping: Record<string, string> = {
        'Colombian restaurant': 'Colombian',
        'Italian restaurant': 'Italian',
        'Asian restaurant': 'Asian',
        'Steakhouse': 'Steakhouse',
        'Mexican restaurant': 'Mexican',
        'Japanese restaurant': 'Japanese',
        'Chinese restaurant': 'Chinese',
        'Seafood restaurant': 'Seafood',
        'Pizza restaurant': 'Pizza',
        'Burger restaurant': 'Burger',
        'Peruvian restaurant': 'Peruvian',
        'French restaurant': 'French',
        'Spanish restaurant': 'Spanish',
        'Mediterranean restaurant': 'Mediterranean',
        'Vegetarian restaurant': 'Vegetarian',
        'Sushi restaurant': 'Sushi',
        'Venezuelan restaurant': 'Venezuelan'
      };
      return mapping[query] || 'Restaurant';
    };

    // Process ALL localities and cuisine types for massive coverage
    console.log(`🚀 Starting massive population: ${localidades.length} localities × ${cuisineTypes.length} cuisine types`);
    
    for (const localidad of localidades) { // ALL 20 localities
      for (const cuisineType of cuisineTypes) { // ALL 17 cuisine types
        try {
          const textQuery = `${cuisineType} in ${localidad.nombre}, Bogotá, Colombia`;
          
          console.log(`🔍 Buscando: ${textQuery}`);

          const response = await fetch(
            'https://places.googleapis.com/v1/places:searchText',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': [
                  'places.id',
                  'places.displayName',
                  'places.formattedAddress',
                  'places.location',
                  'places.rating',
                  'places.userRatingCount',
                  'places.priceLevel',
                  'places.photos',
                  'places.types',
                  'places.currentOpeningHours',
                  'places.internationalPhoneNumber',
                  'places.websiteUri',
                  'places.editorialSummary'
                ].join(',')
              },
              body: JSON.stringify({
                textQuery,
                languageCode: 'es',
                regionCode: 'CO',
                locationBias: {
                  circle: {
                    center: { latitude: 4.7110, longitude: -74.0721 },
                    radius: 25000.0
                  }
                },
                maxResultCount: 20 // Maximum allowed by Google Places API
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error API para "${textQuery}": ${errorText}`);
            errors.push(`${textQuery}: ${errorText}`);
            continue;
          }

          const result = await response.json();
          const places = result.places || [];
          
          console.log(`   ✓ Encontrados ${places.length} lugares`);

          for (const place of places) {
            totalRestaurants++;

            // Verificar si ya existe en caché
            const { data: existing } = await supabase
              .from('restaurant_cache')
              .select('id')
              .eq('place_id', place.id)
              .maybeSingle();

            if (existing) {
              console.log(`   ⏭️  Ya existe: ${place.displayName?.text || 'Sin nombre'}`);
              continue;
            }

            // Preparar datos del restaurante
            const restaurantData = {
              place_id: place.id,
              name: place.displayName?.text || 'Sin nombre',
              formatted_address: place.formattedAddress || '',
              neighborhood: extractNeighborhood(place.formattedAddress || ''),
              location: {
                lat: place.location?.latitude,
                lng: place.location?.longitude
              },
              rating: place.rating || null,
              user_ratings_total: place.userRatingCount || null,
              price_level: place.priceLevel ? place.priceLevel.replace('PRICE_LEVEL_', '') : null,
              photos: place.photos?.map((p: any) => ({
                name: p.name,
                photo_reference: p.name
              })) || [],
              types: place.types || [],
              opening_hours: place.currentOpeningHours?.weekdayDescriptions || null,
              open_now: place.currentOpeningHours?.openNow || null,
              phone_number: place.internationalPhoneNumber || null,
              website: place.websiteUri || null,
              description: place.editorialSummary?.text || null,
              cuisine: mapCuisineType(cuisineType),
              search_query: textQuery,
              cached_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            // Insertar en base de datos
            const { error: insertError } = await supabase
              .from('restaurant_cache')
              .upsert(restaurantData, { onConflict: 'place_id' });

            if (insertError) {
              console.error(`   ❌ Error insertando "${restaurantData.name}":`, insertError);
              errors.push(`${restaurantData.name}: ${insertError.message}`);
            } else {
              newRestaurants++;
              console.log(`   ✅ Agregado: ${restaurantData.name} (${restaurantData.neighborhood})`);
            }
          }

          // Delay to avoid rate limiting (500ms between requests)
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`❌ Error procesando ${cuisineType} en ${localidad.nombre}:`, error);
          errors.push(`${cuisineType} - ${localidad.nombre}: ${errorMsg}`);
        }
      }
    }

    const summary = {
      success: true,
      totalProcessed: totalRestaurants,
      newRestaurants,
      duplicates: totalRestaurants - newRestaurants,
      errors: errors.length,
      errorDetails: errors.slice(0, 10) // Solo primeros 10 errores
    };

    console.log('📊 Resumen final:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('💥 Error general:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMsg 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
