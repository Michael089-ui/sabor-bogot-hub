import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Search, SlidersHorizontal, Plus, Minus, Navigation, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRestaurants, getPhotoUrl, RestaurantFilters } from "@/hooks/useRestaurants";
import { QuickRecommendationModal } from "@/components/QuickRecommendationModal";
import { useLocalidades, useBarriosPorLocalidad } from "@/hooks/useBarriosBogota";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const CUISINE_TYPES = [
  "Colombian",
  "Asian",
  "Italian",
  "Steakhouse",
  "Mexican",
  "Japanese",
  "Chinese",
  "Mediterranean",
  "French",
  "American",
  "Peruvian",
  "Spanish",
  "Thai",
  "Indian",
  "Vietnamese",
  "Korean",
  "Brazilian",
];

const getCuisineDisplay = (restaurant: any): string => {
  const cuisine = restaurant.cuisine || restaurant.types?.[0]?.replace(/_/g, " ") || "";
  
  // Check if cuisine matches any predefined type (case insensitive)
  const matchesPredefined = CUISINE_TYPES.some(
    type => cuisine.toLowerCase().includes(type.toLowerCase())
  );
  
  if (matchesPredefined || !cuisine) {
    return cuisine || "Restaurante";
  }
  
  return "Otro";
};

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 4.6097,
  lng: -74.0817
};

// Íconos SVG codificados
const restaurantIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="10" fill="hsl(12, 88%, 58%)" stroke="white" stroke-width="3"/>
    </svg>
  `)}`
};

const userLocationIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="8" fill="hsl(142, 48%, 45%)" stroke="white" stroke-width="4"/>
    </svg>
  `)}`
};


export default function Mapa() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RestaurantFilters>({
    cuisine: [],
    priceLevel: [],
    neighborhood: [],
    minRating: undefined,
    openNow: undefined,
  });
  const { data: restaurants = [], isLoading } = useRestaurants(undefined, filters);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof restaurants[0] | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedLocalidadId, setSelectedLocalidadId] = useState<string | null>(null);
  
  const { data: localidades = [], isLoading: loadingLocalidades } = useLocalidades();
  const { data: barrios = [], isLoading: loadingBarrios } = useBarriosPorLocalidad(selectedLocalidadId);

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
    (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(mapSearchQuery.toLowerCase()))
  );

  const activeFiltersCount = [
    filters.cuisine.length > 0,
    filters.priceLevel.length > 0,
    filters.neighborhood.length > 0,
    filters.minRating !== undefined,
    filters.openNow !== undefined,
  ].filter(Boolean).length;

  const handleLocate = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          map.panTo(newLocation);
          map.setZoom(16);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const handleZoomIn = () => {
    if (map) {
      map.setZoom((map.getZoom() || 13) + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom((map.getZoom() || 13) - 1);
    }
  };

  const handleRestaurantClick = (restaurant: typeof restaurants[0]) => {
    setSelectedRestaurant(restaurant);
    if (map && restaurant.location?.lat && restaurant.location?.lng) {
      map.panTo({ lat: restaurant.location.lat, lng: restaurant.location.lng });
      map.setZoom(16);
    }
  };

  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsLoaded(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-96 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex gap-2">
            <Select onValueChange={(value) => setFilters(prev => ({ ...prev, cuisine: [value] }))}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Tipo de comida" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="Colombian">Colombiana</SelectItem>
                <SelectItem value="Mexican">Mexicana</SelectItem>
                <SelectItem value="Peruvian">Peruana</SelectItem>
                <SelectItem value="Brazilian">Brasileña</SelectItem>
                <SelectItem value="Italian">Italiana</SelectItem>
                <SelectItem value="French">Francesa</SelectItem>
                <SelectItem value="Spanish">Española</SelectItem>
                <SelectItem value="Mediterranean">Mediterránea</SelectItem>
                <SelectItem value="American">Americana</SelectItem>
                <SelectItem value="Steakhouse">Parrilla</SelectItem>
                <SelectItem value="Asian">Asiática</SelectItem>
                <SelectItem value="Japanese">Japonesa</SelectItem>
                <SelectItem value="Chinese">China</SelectItem>
                <SelectItem value="Thai">Tailandesa</SelectItem>
                <SelectItem value="Vietnamese">Vietnamita</SelectItem>
                <SelectItem value="Korean">Coreana</SelectItem>
                <SelectItem value="Indian">India</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setFilters(prev => ({ ...prev, priceLevel: [value] }))}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">$</SelectItem>
                <SelectItem value="2">$$</SelectItem>
                <SelectItem value="3">$$$</SelectItem>
                <SelectItem value="4">$$$$</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select 
              onValueChange={(value) => {
                setSelectedLocalidadId(value);
                // Get localidad name and set neighborhood filter with all barrios from that localidad
                const localidad = localidades.find(l => l.id_localidad === value);
                if (localidad) {
                  setFilters(prev => ({ ...prev, neighborhood: [], localidad: localidad.nombre }));
                }
              }}
              disabled={loadingLocalidades}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={loadingLocalidades ? "Cargando..." : "Localidad"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {localidades.map((localidad) => (
                  <SelectItem key={localidad.id_localidad} value={localidad.id_localidad}>
                    {localidad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              onValueChange={(value) => {
                const barrio = barrios.find(b => b.id_barrio === value);
                if (barrio) {
                  setFilters(prev => ({ ...prev, neighborhood: [barrio.nombre] }));
                }
              }}
              disabled={!selectedLocalidadId || loadingBarrios}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={
                  !selectedLocalidadId 
                    ? "Primero selecciona localidad" 
                    : loadingBarrios 
                      ? "Cargando..." 
                      : "Barrio"
                } />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {barrios.map((barrio) => (
                  <SelectItem key={barrio.id_barrio} value={barrio.id_barrio}>
                    {barrio.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: parseFloat(value) }))}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Calificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                <SelectItem value="4.0">4.0+ estrellas</SelectItem>
                <SelectItem value="3.5">3.5+ estrellas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(value) => setFilters(prev => ({ ...prev, openNow: value === "true" }))}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Disponible ahora</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => {
                setFilters({ cuisine: [], priceLevel: [], neighborhood: [], minRating: undefined, openNow: undefined });
                setSelectedLocalidadId(null);
                setMapSearchQuery("");
              }}
              disabled={activeFiltersCount === 0}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Limpiar filtros
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Cargando restaurantes...</div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No se encontraron restaurantes</div>
            ) : (
              filteredRestaurants.map((restaurant) => {
                // Priorizar fotos del caché, luego Google Places, luego imagen por defecto
                const photoUrl = restaurant.photos && restaurant.photos.length > 0
                  ? getPhotoUrl(restaurant.photos[0], 400)
                  : `https://source.unsplash.com/400x300/?restaurant,food,${encodeURIComponent(restaurant.cuisine || 'dining')}`;
                
                return (
                  <div
                    key={restaurant.id}
                    className={`bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                      selectedRestaurant?.id === restaurant.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                    }`}
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <img src={photoUrl} alt={restaurant.name} className="w-full h-32 object-cover" />
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground mb-1">{restaurant.name}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="secondary" className="text-xs">
                          {getCuisineDisplay(restaurant)}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">⭐ {restaurant.rating?.toFixed(1) || 'N/A'}</span>
                          <span className="text-muted-foreground">{restaurant.price_level || '$$'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <Button 
            className="w-full gap-2" 
            onClick={() => setShowRecommendationModal(true)}
          >
            <Sparkles className="h-4 w-4" />
            Recomiéndame algo
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar restaurantes en el mapa..."
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              className="pl-10 bg-background/95 backdrop-blur-sm shadow-lg"
            />
          </div>
        </div>

        <LoadScript 
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          onLoad={() => setIsLoaded(true)}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={13}
            onLoad={onLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
            }}
          >
            {isLoaded && filteredRestaurants
              .filter(r => r.location?.lat && r.location?.lng)
              .map((restaurant) => (
                <Marker
                  key={restaurant.id}
                  position={{ lat: restaurant.location.lat, lng: restaurant.location.lng }}
                  onClick={() => setSelectedRestaurant(restaurant)}
                  icon={restaurantIcon}
                />
              ))}

            {isLoaded && selectedRestaurant && selectedRestaurant.location?.lat && selectedRestaurant.location?.lng && (
              <InfoWindow
                position={{ lat: selectedRestaurant.location.lat, lng: selectedRestaurant.location.lng }}
                onCloseClick={() => setSelectedRestaurant(null)}
              >
                <div className="w-48">
                  <img 
                    src={selectedRestaurant.photos && selectedRestaurant.photos.length > 0
                      ? getPhotoUrl(selectedRestaurant.photos[0], 400)
                      : `https://source.unsplash.com/400x300/?restaurant,food,${encodeURIComponent(selectedRestaurant.cuisine || 'dining')}`
                    } 
                    alt={selectedRestaurant.name} 
                    className="w-full h-24 object-cover rounded mb-2"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400';
                    }}
                  />
                  <h3 className="font-semibold text-sm mb-1">{selectedRestaurant.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {getCuisineDisplay(selectedRestaurant)}
                  </p>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-yellow-500">⭐ {selectedRestaurant.rating?.toFixed(1) || 'N/A'}</span>
                    <span className="text-muted-foreground">{selectedRestaurant.price_level || '$$'}</span>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => navigate(`/restaurantes/${selectedRestaurant.place_id}`)}>
                    Ver detalles
                  </Button>
                </div>
              </InfoWindow>
            )}

            {isLoaded && userLocation && (
              <Marker 
                position={userLocation}
                icon={userLocationIcon}
              />
            )}
          </GoogleMap>
        </LoadScript>

        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
          <Button 
            size="icon" 
            className="shadow-glow bg-primary hover:bg-primary-hover text-primary-foreground rounded-full h-12 w-12 transition-all hover:scale-110" 
            onClick={handleZoomIn}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            className="shadow-glow bg-primary hover:bg-primary-hover text-primary-foreground rounded-full h-12 w-12 transition-all hover:scale-110" 
            onClick={handleZoomOut}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            className="shadow-glow bg-accent hover:bg-accent/90 text-accent-foreground rounded-full h-12 w-12 transition-all hover:scale-110" 
            onClick={handleLocate}
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <QuickRecommendationModal
        open={showRecommendationModal}
        onOpenChange={setShowRecommendationModal}
        restaurants={restaurants}
        currentFilters={filters}
        userLocation={userLocation || undefined}
      />
    </div>
  );
}
