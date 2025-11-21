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

    // If it's a restaurant query, call Places API first
    if (isRestaurantQuery && SUPABASE_URL) {
      console.log('🔍 Detected restaurant query, calling Places API...');
      
      const searchParams = extractSearchParams(lastUserMessage.content);
      
      try {
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
            console.log('✅ Got', placesData.restaurants.length, 'real restaurants from Places API');
            
            // Enrich system prompt with real data
            enrichedSystemPrompt = `${systemPrompt}

**DATOS REALES DE GOOGLE PLACES API:**
Usa ÚNICAMENTE los siguientes restaurantes reales de Google Places. NO inventes datos.

${JSON.stringify(placesData.restaurants, null, 2)}

**INSTRUCCIONES CRÍTICAS:**
1. Usa SOLO los restaurantes de la lista anterior (datos verificados de Google Places)
2. Menciona los ratings reales, horarios y precios exactos
3. DEBES incluir las coordenadas EXACTAS (lat, lng) de cada restaurante en tu respuesta
4. Mantén el formato de respuesta con la estructura: Nombre | Lat,Lng | Rating | Precio
5. Añade descripciones personalizadas y útiles basadas en los datos reales
6. Si un restaurante está cerrado, menciónalo
7. Incluye el número de reseñas si está disponible`;
          }
        }
      } catch (error) {
        console.error('Error calling Places API:', error);
        // Continue with regular Gemini response if Places API fails
      }
    }

    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
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
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
