import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { detectRestaurantQuery, extractSearchParams } from './_helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt } = await req.json();
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    
    console.log('Processing chat request with', messages.length, 'messages');

    // Detect if this is a restaurant search query
    const lastUserMessage = messages[messages.length - 1];
    const isRestaurantQuery = lastUserMessage?.role === 'user' && 
      detectRestaurantQuery(lastUserMessage.content);

    let enrichedSystemPrompt = systemPrompt;

    // If it's a restaurant query, search in cache FIRST, then Places API
    if (isRestaurantQuery && SUPABASE_URL) {
      console.log('🔍 Detected restaurant query, searching in database cache...');
      
      const searchParams = extractSearchParams(lastUserMessage.content);
      
      try {
        // Call our optimized places-search which prioritizes cache
        const placesResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/places-search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchParams.query,
              neighborhood: searchParams.neighborhood
            })
          }
        );

        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          
          if (placesData.restaurants && placesData.restaurants.length > 0) {
            const source = placesData.cached ? 'caché local' : 'Google Places API';
            console.log(`✅ Got ${placesData.restaurants.length} restaurants from ${source}`);
            
            // Enrich system prompt with real data
            enrichedSystemPrompt = `${systemPrompt}

**DATOS REALES DE RESTAURANTES${placesData.cached ? ' (CACHÉ LOCAL)' : ' (GOOGLE PLACES API)'}:**
Usa ÚNICAMENTE los siguientes restaurantes reales. NO inventes datos.

${JSON.stringify(placesData.restaurants, null, 2)}

**INSTRUCCIONES CRÍTICAS:**
1. Usa SOLO los restaurantes de la lista anterior (datos verificados)
2. TODOS estos restaurantes tienen place_id válidos - puedes enlazarlos con seguridad
3. Menciona los ratings reales, horarios y precios exactos
4. DEBES incluir las coordenadas EXACTAS (lat, lng) de cada restaurante en tu respuesta
5. Mantén el formato de respuesta con la estructura: Nombre | place_id | Lat,Lng | Rating | Precio
6. Añade descripciones personalizadas y útiles basadas en los datos reales
7. Si un restaurante está cerrado, menciónalo
8. Incluye el número de reseñas si está disponible
9. Los usuarios pueden hacer clic en las tarjetas para ver más detalles, así que proporciona place_id correcto`;
          }
        }
      } catch (error) {
        console.error('Error calling Places API:', error);
        console.log('⚠️ Continuando con respuesta de IA sin datos de restaurantes');
        // Continue with regular Gemini response if Places API fails
      }
    }

    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Servicio de IA no disponible',
          details: 'La clave de API no está configurada. Por favor contacta al administrador.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing chat request with', messages.length, 'messages');

    // Convert messages to Gemini format
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Prepare request body with system instruction
    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    // Add system instruction (enriched with Places data if available)
    if (enrichedSystemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: enrichedSystemPrompt }]
      };
    }

    console.log('Sending request to Gemini with system instruction');

    // Call Google Gemini API with streaming
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${GOOGLE_GEMINI_API_KEY}&alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      let errorMessage = 'El servicio de IA no está disponible en este momento';
      if (response.status === 429) {
        errorMessage = 'Demasiadas solicitudes. Por favor intenta en unos momentos.';
      } else if (response.status === 403) {
        errorMessage = 'Acceso denegado al servicio de IA. Verifica la configuración.';
      } else if (response.status >= 500) {
        errorMessage = 'El servicio de IA está experimentando problemas. Intenta más tarde.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `Error ${response.status}`,
          retryable: response.status === 429 || response.status >= 500
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
    
    return new Response(
      JSON.stringify({ 
        error: isNetworkError 
          ? 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.'
          : 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
        details: errorMessage,
        retryable: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
