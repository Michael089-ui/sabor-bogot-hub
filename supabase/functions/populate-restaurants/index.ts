/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Función principal que ejecuta la población masiva en background
async function performMassivePopulation() {
  const startTime = Date.now();
  console.log('🚀 INICIANDO POBLACIÓN MASIVA EN BACKGROUND');
  console.log(`⏰ Hora de inicio: ${new Date().toISOString()}`);

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ GOOGLE_MAPS_API_KEY no configurado');
      return;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener todas las localidades de Bogotá
    const { data: localidades, error: localidadesError } = await supabase
      .from('localidad')
      .select('nombre')
      .order('numero', { ascending: true });

    if (localidadesError) {
      console.error(`❌ Error obteniendo localidades: ${localidadesError.message}`);
      return;
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
    let duplicates = 0;
    const errors: string[] = [];
    const totalSearches = localidades.length * cuisineTypes.length;
    let completedSearches = 0;

    console.log(`🎯 Total de búsquedas a realizar: ${totalSearches}`);
    console.log(`📊 Cobertura: ${localidades.length} localidades × ${cuisineTypes.length} tipos de cocina`);
    
    for (const localidad of localidades) {
      const localidadStartTime = Date.now();
      let localidadNewRestaurants = 0;
      
      console.log(`\n📍 PROCESANDO LOCALIDAD: ${localidad.nombre.toUpperCase()}`);
      
      for (const cuisineType of cuisineTypes) {
        try {
          const textQuery = `${cuisineType} in ${localidad.nombre}, Bogotá, Colombia`;
          completedSearches++;
          
          console.log(`🔍 [${completedSearches}/${totalSearches}] ${textQuery}`);

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
                maxResultCount: 20
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`   ❌ Error API: ${errorText}`);
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
              duplicates++;
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
              localidadNewRestaurants++;
              console.log(`   ✅ Agregado: ${restaurantData.name}`);
            }
          }

          // Delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`❌ Error procesando ${cuisineType} en ${localidad.nombre}:`, error);
          errors.push(`${cuisineType} - ${localidad.nombre}: ${errorMsg}`);
        }
      }

      // Resumen por localidad
      const localidadDuration = ((Date.now() - localidadStartTime) / 1000 / 60).toFixed(1);
      console.log(`\n✅ COMPLETADA ${localidad.nombre}: ${localidadNewRestaurants} nuevos restaurantes en ${localidadDuration} minutos`);
      console.log(`📊 Progreso global: ${completedSearches}/${totalSearches} búsquedas (${((completedSearches/totalSearches)*100).toFixed(1)}%)`);
    }

    // Resumen final
    const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log('\n' + '='.repeat(80));
    console.log('🎉 POBLACIÓN MASIVA COMPLETADA');
    console.log('='.repeat(80));
    console.log(`⏱️  Duración total: ${totalDuration} minutos`);
    console.log(`📊 Búsquedas realizadas: ${completedSearches}/${totalSearches}`);
    console.log(`🆕 Restaurantes nuevos agregados: ${newRestaurants}`);
    console.log(`🔄 Restaurantes duplicados (ya existían): ${duplicates}`);
    console.log(`📝 Total de registros procesados: ${totalRestaurants}`);
    console.log(`❌ Errores: ${errors.length}`);
    console.log(`⏰ Finalizado: ${new Date().toISOString()}`);
    console.log('='.repeat(80));

    if (errors.length > 0) {
      console.log('\n⚠️  Primeros 10 errores:');
      errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
    }

  } catch (error) {
    console.error('💥 ERROR CRÍTICO EN POBLACIÓN MASIVA:', error);
    console.error(`⏰ Falló después de ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} minutos`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Solicitud de población masiva recibida');
    console.log('⏰ Iniciando proceso en background...');

    // Ejecutar la población en background usando globalThis
    const runtime = globalThis as any;
    if (runtime.EdgeRuntime && runtime.EdgeRuntime.waitUntil) {
      runtime.EdgeRuntime.waitUntil(performMassivePopulation());
    } else {
      // Fallback: ejecutar sin waitUntil
      performMassivePopulation().catch(err => console.error('Error en background task:', err));
    }

    // Retornar respuesta inmediata al cliente
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Población masiva iniciada en background. El proceso tomará aproximadamente 25-35 minutos.',
        instructions: 'Puedes cerrar esta página. Revisa los logs del Edge Function para ver el progreso en tiempo real.',
        logsUrl: 'https://supabase.com/dashboard/project/ozladdazcubyvmgdpyop/functions/populate-restaurants/logs'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('💥 Error al iniciar población:', error);
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
