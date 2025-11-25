import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, DollarSign, RefreshCw, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPhotoUrl, formatPriceLevel } from "@/hooks/useRestaurants";

interface Restaurant {
  id: string;
  place_id: string;
  name: string;
  rating?: number;
  price_level?: string;
  formatted_address?: string;
  neighborhood?: string;
  cuisine?: string;
  types?: string[];
  photos?: any[];
}

interface QuickRecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurants: Restaurant[];
  currentFilters?: any;
  userLocation?: { lat: number; lng: number };
}

export const QuickRecommendationModal = ({
  open,
  onOpenChange,
  restaurants,
  currentFilters,
  userLocation,
}: QuickRecommendationModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Seleccionar un restaurante aleatorio de calidad (rating >= 4.0)
  const selectRandomRestaurant = () => {
    if (!restaurants || restaurants.length === 0) {
      toast({
        title: "No hay restaurantes disponibles",
        description: "Intenta ajustar los filtros o realizar una búsqueda primero",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Filtrar restaurantes de calidad
    const qualityRestaurants = restaurants.filter(r => 
      r.rating && r.rating >= 4.0
    );

    const pool = qualityRestaurants.length > 0 ? qualityRestaurants : restaurants;
    const randomIndex = Math.floor(Math.random() * pool.length);
    
    setTimeout(() => {
      setCurrentRestaurant(pool[randomIndex]);
      setIsGenerating(false);
    }, 500);
  };

  // Seleccionar restaurante inicial al abrir
  useEffect(() => {
    if (open && !currentRestaurant) {
      selectRandomRestaurant();
    }
  }, [open]);

  const handleViewOnMap = () => {
    if (currentRestaurant) {
      navigate(`/mapa`, { state: { highlightRestaurant: currentRestaurant.place_id } });
      onOpenChange(false);
    }
  };

  const handleViewDetails = () => {
    if (currentRestaurant) {
      navigate(`/restaurantes/${currentRestaurant.place_id}`);
      onOpenChange(false);
    }
  };

  const handlePersonalizedSearch = () => {
    // Generar un prompt contextual basado en filtros y ubicación
    let contextualPrompt = "Recomiéndame un restaurante";

    if (currentFilters?.cuisine && currentFilters.cuisine.length > 0) {
      contextualPrompt += ` de comida ${currentFilters.cuisine.join(" o ")}`;
    }

    if (currentFilters?.priceLevel && currentFilters.priceLevel.length > 0) {
      const priceMap: { [key: string]: string } = {
        "1": "económico",
        "2": "precio moderado",
        "3": "precio alto",
        "4": "precio muy alto",
      };
      const priceDesc = currentFilters.priceLevel.map((p: string) => priceMap[p]).join(" o ");
      contextualPrompt += ` con ${priceDesc}`;
    }

    if (currentFilters?.neighborhood && currentFilters.neighborhood.length > 0) {
      contextualPrompt += ` en ${currentFilters.neighborhood.join(" o ")}`;
    }

    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) {
      contextualPrompt += " para desayunar";
    } else if (hour >= 11 && hour < 16) {
      contextualPrompt += " para almorzar";
    } else if (hour >= 16 && hour < 22) {
      contextualPrompt += " para cenar";
    }

    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      contextualPrompt += " en fin de semana";
    }

    navigate("/chat-ia", { state: { initialPrompt: contextualPrompt } });
    onOpenChange(false);
  };

  if (!currentRestaurant) return null;

  const photoUrl = currentRestaurant.photos && currentRestaurant.photos.length > 0
    ? getPhotoUrl(currentRestaurant.photos[0], 600)
    : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop";

  const getCuisineDisplay = (restaurant: Restaurant): string => {
    if (restaurant.cuisine) return restaurant.cuisine;
    if (restaurant.types && restaurant.types.length > 0) {
      return restaurant.types[0].replace(/_/g, " ");
    }
    return "Restaurante";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Te recomendamos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Imagen del restaurante */}
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                <img
                  src={photoUrl}
                  alt={currentRestaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Información del restaurante */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">
                  {currentRestaurant.name}
                </h3>

                <div className="flex flex-wrap gap-2">
                  {currentRestaurant.rating && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {currentRestaurant.rating}
                    </Badge>
                  )}
                  {currentRestaurant.price_level && (
                    <Badge variant="secondary" className="gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatPriceLevel(currentRestaurant.price_level)}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {getCuisineDisplay(currentRestaurant)}
                  </Badge>
                </div>

                {currentRestaurant.formatted_address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{currentRestaurant.formatted_address}</span>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={handleViewDetails}
                  size="lg"
                  className="w-full"
                >
                  Ver detalles completos
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleViewOnMap}
                    variant="outline"
                    size="lg"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver en mapa
                  </Button>
                  <Button
                    onClick={selectRandomRestaurant}
                    variant="outline"
                    size="lg"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Otro lugar
                  </Button>
                </div>

                <Button
                  onClick={handlePersonalizedSearch}
                  variant="secondary"
                  size="lg"
                  className="w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Búsqueda personalizada con IA
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
