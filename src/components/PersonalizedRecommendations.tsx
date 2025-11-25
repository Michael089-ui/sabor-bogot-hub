import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MapPin, DollarSign } from "lucide-react";
import { useRestaurants } from "@/hooks/useRestaurants";
import { RestauranteCard } from "@/components/RestauranteCard";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonalizedRecommendationsProps {
  tipoComida: string[];
  presupuesto: string | null;
  neighborhood: string | null;
}

const presupuestoToPriceLevel: { [key: string]: string[] } = {
  'economico': ['1', 'PRICE_LEVEL_INEXPENSIVE'],
  'moderado': ['2', 'PRICE_LEVEL_MODERATE'],
  'alto': ['3', 'PRICE_LEVEL_EXPENSIVE'],
  'premium': ['4', 'PRICE_LEVEL_VERY_EXPENSIVE']
};

export const PersonalizedRecommendations = ({ 
  tipoComida, 
  presupuesto, 
  neighborhood 
}: PersonalizedRecommendationsProps) => {
  
  // Construir filtros basados en preferencias
  const filters = {
    cuisine: tipoComida.length > 0 ? tipoComida : undefined,
    priceLevel: presupuesto ? presupuestoToPriceLevel[presupuesto.toLowerCase()] : undefined,
    neighborhood: neighborhood ? [neighborhood] : undefined,
  };

  const { data: restaurants, isLoading } = useRestaurants(6, filters);

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
            <p className="text-sm mt-2">Intenta ajustar tus filtros o explorar más opciones</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
