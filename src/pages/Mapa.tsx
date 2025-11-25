import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Search, SlidersHorizontal, Plus, Minus, Navigation, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRestaurants, getPhotoUrl, RestaurantFilters } from "@/hooks/useRestaurants";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
  const { data: restaurants = [], isLoading } = useRestaurants();
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof restaurants[0] | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showInfoCard, setShowInfoCard] = useState(true);
  
  // Filtros
  const [filters, setFilters] = useState<RestaurantFilters>({
    cuisine: [],
    priceLevel: [],
    neighborhood: [],
    minRating: undefined,
    openNow: undefined,
  });

  // Aplicar filtros
  const filteredRestaurants = useMemo(() => {
    let result = restaurants;

    // Filtro por búsqueda
    if (mapSearchQuery) {
      result = result.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
        (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(mapSearchQuery.toLowerCase())) ||
        (restaurant.neighborhood && restaurant.neighborhood.toLowerCase().includes(mapSearchQuery.toLowerCase()))
      );
    }

    // Filtro por tipo de comida
    if (filters.cuisine && filters.cuisine.length > 0) {
      result = result.filter((restaurant) =>
        filters.cuisine?.some(cuisine => 
          restaurant.cuisine?.toLowerCase().includes(cuisine.toLowerCase()) ||
          restaurant.types?.some(type => type.toLowerCase().includes(cuisine.toLowerCase()))
        )
      );
    }

    // Filtro por precio
    if (filters.priceLevel && filters.priceLevel.length > 0) {
      result = result.filter((restaurant) =>
        filters.priceLevel?.includes(restaurant.price_level || "")
      );
    }

    // Filtro por ubicación
    if (filters.neighborhood && filters.neighborhood.length > 0) {
      result = result.filter((restaurant) =>
        filters.neighborhood?.some(neighborhood =>
          restaurant.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase()) ||
          restaurant.formatted_address?.toLowerCase().includes(neighborhood.toLowerCase())
        )
      );
    }

    // Filtro por calificación
    if (filters.minRating) {
      result = result.filter((restaurant) =>
        restaurant.rating && restaurant.rating >= filters.minRating!
      );
    }

    // Filtro por disponibilidad
    if (filters.openNow) {
      result = result.filter((restaurant) => restaurant.open_now === true);
    }

    // Priorizar restaurantes premium (alta calificación y muchas reseñas)
    result = result.sort((a, b) => {
      const scoreA = (a.rating || 0) * Math.log((a.user_ratings_total || 1) + 1);
      const scoreB = (b.rating || 0) * Math.log((b.user_ratings_total || 1) + 1);
      return scoreB - scoreA;
    });

    return result;
  }, [restaurants, mapSearchQuery, filters]);

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
            <Select 
              value={filters.cuisine?.[0] || ""} 
              onValueChange={(value) => setFilters(prev => ({...prev, cuisine: value ? [value] : []}))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="colombian">Colombiana</SelectItem>
                <SelectItem value="japanese">Japonesa</SelectItem>
                <SelectItem value="italian">Italiana</SelectItem>
                <SelectItem value="mexican">Mexicana</SelectItem>
                <SelectItem value="american">Americana</SelectItem>
                <SelectItem value="asian">Asiática</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.priceLevel?.[0] || ""} 
              onValueChange={(value) => setFilters(prev => ({...prev, priceLevel: value ? [value] : []}))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="$">$</SelectItem>
                <SelectItem value="$$">$$</SelectItem>
                <SelectItem value="$$$">$$$</SelectItem>
                <SelectItem value="$$$$">$$$$</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select 
              value={filters.neighborhood?.[0] || ""} 
              onValueChange={(value) => setFilters(prev => ({...prev, neighborhood: value ? [value] : []}))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="chapinero">Chapinero</SelectItem>
                <SelectItem value="usaquen">Usaquén</SelectItem>
                <SelectItem value="zona t">Zona T</SelectItem>
                <SelectItem value="parque 93">Parque 93</SelectItem>
                <SelectItem value="zona g">Zona G</SelectItem>
                <SelectItem value="zona rosa">Zona Rosa</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.minRating?.toString() || ""} 
              onValueChange={(value) => setFilters(prev => ({...prev, minRating: value ? parseFloat(value) : undefined}))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Calificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                <SelectItem value="4">4+ estrellas</SelectItem>
                <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                <SelectItem value="3">3+ estrellas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select 
              value={filters.openNow ? "true" : ""} 
              onValueChange={(value) => setFilters(prev => ({...prev, openNow: value === "true" ? true : undefined}))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Abierto ahora</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setFilters({
                cuisine: [],
                priceLevel: [],
                neighborhood: [],
                minRating: undefined,
                openNow: undefined,
              })}
            >
              <X className="h-4 w-4" />
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
                const photoUrl = restaurant.photos && restaurant.photos.length > 0
                  ? getPhotoUrl(restaurant.photos[0], 400)
                  : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400';
                
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
                          {restaurant.cuisine || restaurant.types?.[0]?.replace(/_/g, " ") || "Restaurante"}
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
          <Button className="w-full" onClick={() => navigate("/chat-ia")}>
            🤖 Recomiéndame algo
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

        {/* Carta informativa flotante */}
        {showInfoCard && (
          <Card className="absolute top-20 left-4 z-10 w-80 shadow-elegant bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 -mt-1"
                  onClick={() => setShowInfoCard(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-lg">Explora restaurantes en el mapa</CardTitle>
              <CardDescription>
                Descubre los mejores lugares de Bogotá
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Usa los filtros para encontrar restaurantes por tipo, precio, ubicación y calificación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Haz clic en un restaurante para ver más detalles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Los restaurantes premium se muestran primero según calificación y popularidad</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

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
                      : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'
                    } 
                    alt={selectedRestaurant.name} 
                    className="w-full h-24 object-cover rounded mb-2" 
                  />
                  <h3 className="font-semibold text-sm mb-1">{selectedRestaurant.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {selectedRestaurant.cuisine || selectedRestaurant.types?.[0]?.replace(/_/g, " ") || "Restaurante"}
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
    </div>
  );
}