// Helper functions for chat edge function

export function detectRestaurantQuery(message: string): boolean {
  const restaurantKeywords = [
    'restaurante', 'comida', 'comer', 'almorzar', 'cenar',
    'italiano', 'mexicano', 'japonés', 'chino', 'colombiano',
    'pizza', 'sushi', 'tacos', 'hamburguesa', 'pasta',
    'recomendación', 'recomienda', 'dónde', 'lugar', 'sitio',
    'mejor', 'bueno', 'rico', 'delicioso'
  ];

  const messageLower = message.toLowerCase();
  return restaurantKeywords.some(keyword => messageLower.includes(keyword));
}

export function extractSearchParams(message: string): { query: string; neighborhood?: string } {
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
  for (const cuisine of cuisineTypes) {
    if (messageLower.includes(cuisine)) {
      query = cuisine;
      break;
    }
  }

  return { query, neighborhood };
}
