// Helper functions for chat edge function

export function detectRestaurantQuery(message: string): boolean {
  const restaurantKeywords = [
    'restaurante', 'comida', 'comer', 'almorzar', 'cenar',
    'italiano', 'mexicano', 'japonés', 'chino', 'colombiano',
    'pizza', 'sushi', 'tacos', 'hamburguesa', 'pasta',
    'recomendación', 'recomienda', 'dónde', 'lugar', 'sitio',
    'mejor', 'bueno', 'rico', 'delicioso',
    // Respuestas afirmativas para búsqueda con preferencias
    'sí', 'si', 'claro', 'dale', 'ok', 'perfecto', 'preferencias',
    'mis gustos', 'basado en', 'según mis'
  ];

  const messageLower = message.toLowerCase();
  return restaurantKeywords.some(keyword => messageLower.includes(keyword));
}

export function detectPreferenceConfirmation(message: string): boolean {
  const confirmationKeywords = [
    'sí', 'si', 'claro', 'dale', 'ok', 'perfecto', 
    'preferencias', 'mis gustos', 'basado en', 'según mis'
  ];
  
  const messageLower = message.toLowerCase();
  return confirmationKeywords.some(keyword => messageLower.includes(keyword));
}

export function extractSearchParams(message: string, userPreferences?: any): { query: string; neighborhood?: string } {
  const messageLower = message.toLowerCase();
  
  // Bogotá neighborhoods
  const neighborhoods = [
    'usaquén', 'chapinero', 'santa fe', 'san cristóbal', 'usme',
    'tunjuelito', 'bosa', 'kennedy', 'fontibón', 'engativá',
    'suba', 'barrios unidos', 'teusaquillo', 'mártires', 'antonio nariño',
    'puente aranda', 'candelaria', 'rafael uribe', 'ciudad bolívar',
    'zona rosa', 'parque 93', 'zona t', 'chicó', 'rosales',
    'quinta camacho', 'cedritos', 'chapinero alto'
  ];

  // Extract neighborhood
  let neighborhood: string | undefined;
  for (const n of neighborhoods) {
    if (messageLower.includes(n)) {
      neighborhood = n;
      break;
    }
  }

  // Extract cuisine type or general query
  const cuisineTypes = [
    'italiano', 'mexicano', 'japonés', 'chino', 'colombiano',
    'pizza', 'sushi', 'tacos', 'hamburguesa', 'pasta',
    'vegetariano', 'vegano', 'mariscos', 'carne', 'pollo'
  ];

  let query = 'restaurante';
  
  // If user has preferences and confirms, use their preferences
  if (userPreferences?.tipo_comida?.length > 0) {
    query = userPreferences.tipo_comida[0]; // Use first preference
  } else {
    // Otherwise extract from message
    for (const cuisine of cuisineTypes) {
      if (messageLower.includes(cuisine)) {
        query = cuisine;
        break;
      }
    }
  }

  return { query, neighborhood };
}
