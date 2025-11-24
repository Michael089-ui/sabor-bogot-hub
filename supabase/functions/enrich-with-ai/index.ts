import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  placeId: string;
  enrichmentType: 'description' | 'classification' | 'all';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId, enrichmentType = 'all' }: EnrichRequest = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener datos del restaurante
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurant_cache')
      .select('*')
      .eq('place_id', placeId)
      .single();

    if (fetchError || !restaurant) {
      throw new Error('Restaurant not found');
    }

    console.log(`Enriching: ${restaurant.name}`);

    const result: any = {
      success: true,
      placeId: placeId,
      description: null,
      cuisine: null,
      features: []
    };

    // Generar descripción con Gemini
    if (enrichmentType === 'description' || enrichmentType === 'all') {
      const descriptionPrompt = `Eres un experto en gastronomía y turismo en Bogotá. 

Genera una descripción atractiva y natural de 50-100 palabras en español para este restaurante:

Nombre: ${restaurant.name}
Barrio: ${restaurant.neighborhood || 'Bogotá'}
Tipos: ${restaurant.types?.join(', ') || 'Restaurante'}
Rating: ${restaurant.rating || 'N/A'}
Precio: ${restaurant.price_level ? '$'.repeat(restaurant.price_level) : 'N/A'}

Instrucciones:
- Escribe en un tono cálido y acogedor
- Menciona el tipo de cocina si es evidente
- Destaca el ambiente o experiencia esperada
- NO menciones que es información generada por IA
- Sé específico pero no inventes datos que no tienes

Descripción:`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: descriptionPrompt }]
            }],
            generationConfig: {
              maxOutputTokens: 200,
              temperature: 0.7
            }
          })
        }
      );

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        const description = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (description) {
          result.description = description;
          console.log(`✅ Generated description for ${restaurant.name}`);
        }
      } else {
        console.error('Gemini API error:', await geminiResponse.text());
      }
    }

    // Clasificación automática
    if (enrichmentType === 'classification' || enrichmentType === 'all') {
      const types = restaurant.types || [];
      const name = restaurant.name.toLowerCase();
      
      // Inferir tipo de cocina
      let cuisine = null;
      const features: string[] = [];

      if (types.includes('italian_restaurant') || name.includes('italian') || name.includes('pizza')) {
        cuisine = 'Italiana';
      } else if (types.includes('japanese_restaurant') || name.includes('sushi') || name.includes('japanese')) {
        cuisine = 'Japonesa';
      } else if (types.includes('chinese_restaurant') || name.includes('chinese')) {
        cuisine = 'China';
      } else if (types.includes('mexican_restaurant') || name.includes('mexican') || name.includes('taco')) {
        cuisine = 'Mexicana';
      } else if (name.includes('burger') || name.includes('hambur')) {
        cuisine = 'Hamburguesas';
      } else if (name.includes('café') || name.includes('coffee') || types.includes('cafe')) {
        cuisine = 'Café';
      } else if (name.includes('colombian') || name.includes('colombiano')) {
        cuisine = 'Colombiana';
      } else if (types.includes('bar')) {
        cuisine = 'Bar';
      } else if (types.includes('restaurant')) {
        cuisine = 'Internacional';
      }

      // Inferir características
      if (name.includes('terraza') || name.includes('terrace')) {
        features.push('terraza');
      }
      if (name.includes('pet') || name.includes('mascota')) {
        features.push('pet-friendly');
      }
      if (types.includes('bar') || name.includes('bar')) {
        features.push('bar');
      }
      if (types.includes('cafe') || name.includes('café')) {
        features.push('café');
      }

      result.cuisine = cuisine;
      result.features = features;

      console.log(`✅ Classified ${restaurant.name}: ${cuisine}, Features: ${features.join(', ')}`);
    }

    // Actualizar en base de datos
    const updateData: any = {};
    if (result.description) updateData.description = result.description;
    if (result.cuisine) updateData.cuisine = result.cuisine;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('restaurant_cache')
        .update(updateData)
        .eq('place_id', placeId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in enrich-with-ai:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
