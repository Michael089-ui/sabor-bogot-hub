import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { detectRestaurantQuery, detectPreferenceConfirmation, extractSearchParams } from './_helpers.ts';

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
    const { messages, systemPrompt, userPreferences } = await req.json();
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    
    console.log('Processing chat request with', messages.length, 'messages');

    // Detect if this is a restaurant search query
    const lastUserMessage = messages[messages.length - 1];
    const isFirstMessage = messages.length === 1;
    const isSecondMessage = messages.length === 3; // User's first response after bot greeting
    const isPreferenceConfirmation = detectPreferenceConfirmation(lastUserMessage.content);
    
    const isRestaurantQuery = lastUserMessage?.role === 'user' && 
      detectRestaurantQuery(lastUserMessage.content);

    let enrichedSystemPrompt = systemPrompt;
    let restaurantMetadata: any[] = [];
    
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

    // For first message, ask about preferences
    if (isFirstMessage && userPreferences && (userPreferences.tipo_comida?.length || userPreferences.presupuesto)) {
      enrichedSystemPrompt += `\n\n**IMPORTANTE - PRIMER MENSAJE:** 
      El usuario acaba de iniciar la conversación. Antes de hacer cualquier recomendación:
      1. Salúdalo amigablemente
      2. Pregúntale si prefiere recomendaciones basadas en sus preferencias guardadas (${userPreferences.tipo_comida?.join(', ') || 'sus gustos'}${userPreferences.presupuesto ? `, presupuesto: ${userPreferences.presupuesto}` : ''}) o si prefiere que le recomiendes algo diferente/general
      3. NO hagas recomendaciones hasta que él responda
      4. Mantén el mensaje corto y directo`;
      
      // Don't search for restaurants on first message
      return await generateChatResponse(enrichedSystemPrompt, messages, GOOGLE_GEMINI_API_KEY, restaurantMetadata, corsHeaders);
    }

    // If user confirms preferences OR it's a restaurant query, search for restaurants
    if ((isRestaurantQuery || (isSecondMessage && isPreferenceConfirmation)) && SUPABASE_URL) {
      console.log('🔍 Detected restaurant query, searching in database cache...');
      
      const searchParams = extractSearchParams(lastUserMessage.content, userPreferences);
      console.log('🔍 Search params:', searchParams);
      
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
            
            // Store metadata to send separately
            restaurantMetadata = placesData.restaurants;
            
            // Enrich system prompt with real data
            enrichedSystemPrompt = `${systemPrompt}

**DATOS REALES DE RESTAURANTES${placesData.cached ? ' (CACHÉ LOCAL)' : ' (GOOGLE PLACES API)'}:**
Tienes acceso a ${placesData.restaurants.length} restaurantes verificados. Estos datos se enviarán automáticamente al frontend, así que NO NECESITAS incluir coordenadas exactas en tu respuesta conversacional.

${JSON.stringify(placesData.restaurants, null, 2)}

**INSTRUCCIONES CRÍTICAS:**
1. **MENCIONA AL MENOS ${Math.min(8, placesData.restaurants.length)} RESTAURANTES** de la lista anterior
2. Enfócate en crear una respuesta CONVERSACIONAL y útil
3. Describe las características, ambiente y especialidades de cada restaurante
4. Usa los datos reales (ratings, precios, tipos de cocina)
5. NO necesitas incluir coordenadas exactas - eso se maneja automáticamente
6. Mantén un tono amigable y profesional
7. Organiza tu respuesta de forma clara y atractiva`;
          }
        }
      } catch (error) {
        console.error('Error calling Places API:', error);
        console.log('⚠️ Continuando con respuesta de IA sin datos de restaurantes');
        // Continue with regular Gemini response if Places API fails
      }
    }

    return await generateChatResponse(enrichedSystemPrompt, messages, GOOGLE_GEMINI_API_KEY, restaurantMetadata, corsHeaders);

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

async function generateChatResponse(systemPrompt: string, messages: any[], apiKey: string, restaurantMetadata: any[], corsHeaders: any) {
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

  // Add system instruction
  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  console.log('Sending request to Gemini with system instruction');

  // Call Google Gemini API with streaming
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${apiKey}&alt=sse`,
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

  // Create a new ReadableStream that injects metadata first
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Start streaming in the background
  (async () => {
    try {
      // Send metadata first if we have restaurant data
      if (restaurantMetadata.length > 0) {
        const metadataEvent = `data: ${JSON.stringify({
          type: 'metadata',
          restaurants: restaurantMetadata
        })}\n\n`;
        await writer.write(encoder.encode(metadataEvent));
      }

      // Then stream the AI response
      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      }
    } catch (error) {
      console.error('Error streaming response:', error);
    } finally {
      writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
