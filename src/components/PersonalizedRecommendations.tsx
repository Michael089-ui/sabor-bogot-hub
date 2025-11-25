import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MapPin, DollarSign } from "lucide-react";
import { useInfiniteRestaurants } from "@/hooks/useRestaurants";
import { RestauranteCard } from "@/components/RestauranteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState, useEffect } from "react";

interface PersonalizedRecommendationsProps {
  tipoComida: string[];
  presupuesto: string | null;
  neighborhood: string | null;
}

// Mapeo de tipos de comida del usuario (español) a valores de la base de datos (inglés)
const cuisineMapping: { [key: string]: string[] } = {
  'Mexicana': ['Mexican'],
  'Italiana': ['Italian', 'Italiana', 'Italian / Pizza'],
  'Colombiana': ['Colombian', 'Contemporary Colombian', 'Colombian / Fine Dining', 'Colombian / Grill', 'Colombian / Steakhouse', 'Colombian / Amazonian', 'Market / Colombian'],
  'China': ['Chinese'],
  'Japonesa': ['Japanese', 'Japonesa', 'Japanese / Grill', 'Japanese / Ramen', 'Nikkei', 'Fusion / Izakaya'],
  'Vegana': ['Vegetarian', 'Vegan', 'Brunch / Healthy'],
  'Vegetariana': ['Vegetarian'],
  'Parrilla': ['BBQ', 'Steakhouse', 'Colombian / Steakhouse', 'International / Grill', 'Mediterranean / Grill'],
  'Mariscos': ['Seafood', 'Peruvian / Seafood'],
  'Postres': ['Bakery', 'Bakery / Brunch', 'Cafe'],
  'Mediterránea': ['Mediterranean', 'Mediterranean / Grill', 'Spanish'],
  'Peruana': ['Peruvian', 'Peruvian / Seafood'],
  'Americana': ['American', 'International'],
  'Francesa': ['French'],
  'Asiática': ['Asian', 'Fusion / Asian'],
  'Árabe': ['Arabic', 'Middle Eastern']
};

const presupuestoToPriceLevel: { [key: string]: string[] } = {
  'economico': ['1', 'PRICE_LEVEL_INEXPENSIVE', 'INEXPENSIVE'],
  'moderado': ['2', 'PRICE_LEVEL_MODERATE', 'MODERATE'],
  'alto': ['3', 'PRICE_LEVEL_EXPENSIVE', 'EXPENSIVE'],
  'premium': ['4', 'PRICE_LEVEL_VERY_EXPENSIVE', 'VERY_EXPENSIVE']
};

// Función para convertir preferencias de usuario a valores de la base de datos
const convertCuisinePreferences = (userPreferences: string[]): string[] => {
  const dbCuisines: string[] = [];
  userPreferences.forEach(pref => {
    const mappedValues = cuisineMapping[pref];
    if (mappedValues) {
      dbCuisines.push(...mappedValues);
    } else {
      // Si no hay mapeo, usar el valor original
      dbCuisines.push(pref);
    }
  });
  return [...new Set(dbCuisines)]; // Eliminar duplicados
};

export const PersonalizedRecommendations = ({ 
  tipoComida, 
  presupuesto, 
  neighborhood 
}: PersonalizedRecommendationsProps) => {
  const [fallbackLevel, setFallbackLevel] = useState(0);
  
  // Convertir tipos de comida del usuario a valores de la base de datos
  const convertedCuisines = useMemo(() => {
    return tipoComida.length > 0 ? convertCuisinePreferences(tipoComida) : undefined;
  }, [tipoComida]);
  
  // Construir filtros basados en preferencias con fallback progresivo
  const filters = useMemo(() => {
    return {
      cuisine: convertedCuisines,
      priceLevel: fallbackLevel < 2 && presupuesto 
        ? presupuestoToPriceLevel[presupuesto.toLowerCase()] 
        : undefined,
      neighborhood: fallbackLevel < 1 && neighborhood ? [neighborhood] : undefined,
    };
  }, [convertedCuisines, presupuesto, neighborhood, fallbackLevel]);

  const { data, isLoading } = useInfiniteRestaurants(filters, 6);

  // Obtener solo los primeros 6 restaurantes
  const restaurants = useMemo(() => {
    const allRestaurants = data?.pages.flatMap(page => page.data) || [];
    return allRestaurants.slice(0, 6);
  }, [data]);

  // Implementar fallback progresivo si no hay resultados
  useEffect(() => {
    if (!isLoading && restaurants.length === 0 && fallbackLevel < 2) {
      setFallbackLevel(prev => prev + 1);
    }
  }, [isLoading, restaurants.length, fallbackLevel]);

  if (!tipoComida.length && !presupuesto && !neighborhood) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recomendaciones Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p className="mb-2">Completa tus preferencias para recibir recomendaciones personalizadas</p>
            <p className="text-sm">Agrega tipo de comida, presupuesto y ubicación en tu perfil</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Recomendaciones Para Ti
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {tipoComida.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded">
              <Sparkles className="w-3 h-3" />
              {tipoComida.slice(0, 2).join(', ')}
              {tipoComida.length > 2 && ` +${tipoComida.length - 2}`}
            </div>
          )}
          {presupuesto && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded">
              <DollarSign className="w-3 h-3" />
              {presupuesto}
            </div>
          )}
          {neighborhood && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded">
              <MapPin className="w-3 h-3" />
              {neighborhood}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : restaurants && restaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((restaurant) => (
              <RestauranteCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No encontramos restaurantes que coincidan con tus preferencias</p>
            <p className="text-sm mt-2">
              {fallbackLevel === 0 && neighborhood 
                ? "No hay restaurantes en tu barrio con esas características"
                : fallbackLevel === 1 && presupuesto
                ? "Ampliamos la búsqueda a otras zonas sin resultados"
                : "Intenta ajustar tus preferencias de tipo de comida"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
