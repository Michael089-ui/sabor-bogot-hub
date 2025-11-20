import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Search, SlidersHorizontal, Plus, Minus, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const GOOGLE_MAPS_API_KEY = "AIzaSyBer6JXdqunENnx3lqiLAszzqqREO8nGY0";

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 4.6097,
  lng: -74.0817
};

const mockRestaurantes = [
  {
    id: 1,
    nombre: "La Cocina de Sofía",
    tipo: "Comida Colombiana",
    calificacion: 4.5,
    precio: "$$$",
    imagen: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    lat: 4.6097,
    lng: -74.0817,
  },
  {
    id: 2,
    nombre: "Sushi Dreams",
    tipo: "Japonesa",
    calificacion: 4.8,
    precio: "$$$$",
    imagen: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
    lat: 4.6534,
    lng: -74.0836,
  },
  {
    id: 3,
    nombre: "Pizza Roma",
    tipo: "Italiana",
    calificacion: 4.3,
    precio: "$$",
    imagen: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    lat: 4.6762,
    lng: -74.0481,
  },
  {
    id: 4,
    nombre: "Tacos El Güero",
    tipo: "Mexicana",
    calificacion: 4.6,
    precio: "$$",
    imagen: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
    lat: 4.6398,
    lng: -74.0892,
  },
  {
    id: 5,
    nombre: "Le Petit Bistro",
    tipo: "Francesa",
    calificacion: 4.7,
    precio: "$$$$",
    imagen: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
    lat: 4.6482,
    lng: -74.0632,
  },
];

export default function Mapa() {
  const navigate = useNavigate();
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof mockRestaurantes[0] | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const filteredRestaurants = mockRestaurantes.filter((restaurant) =>
    restaurant.nombre.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
    restaurant.tipo.toLowerCase().includes(mapSearchQuery.toLowerCase())
  );

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

  const handleRestaurantClick = (restaurant: typeof mockRestaurantes[0]) => {
    setSelectedRestaurant(restaurant);
    if (map) {
      map.panTo({ lat: restaurant.lat, lng: restaurant.lng });
      map.setZoom(16);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-96 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex gap-2">
            <Select>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="colombiana">Colombiana</SelectItem>
                <SelectItem value="japonesa">Japonesa</SelectItem>
                <SelectItem value="italiana">Italiana</SelectItem>
                <SelectItem value="mexicana">Mexicana</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$</SelectItem>
                <SelectItem value="$$">$$</SelectItem>
                <SelectItem value="$$$">$$$</SelectItem>
                <SelectItem value="$$$$">$$$$</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chapinero">Chapinero</SelectItem>
                <SelectItem value="usaquen">Usaquén</SelectItem>
                <SelectItem value="zona-t">Zona T</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Calificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4+ estrellas</SelectItem>
                <SelectItem value="3">3+ estrellas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Select>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ahora">Disponible ahora</SelectItem>
                <SelectItem value="hoy">Disponible hoy</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className={`bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                  selectedRestaurant?.id === restaurant.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
                onClick={() => handleRestaurantClick(restaurant)}
              >
                <img src={restaurant.imagen} alt={restaurant.nombre} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <h3 className="font-semibold text-foreground mb-1">{restaurant.nombre}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="secondary" className="text-xs">{restaurant.tipo}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">⭐ {restaurant.calificacion}</span>
                      <span className="text-muted-foreground">{restaurant.precio}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <Button className="w-full" onClick={() => navigate("/chatia")}>
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

        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={13}
            onLoad={(mapInstance) => setMap(mapInstance)}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
            }}
          >
            {filteredRestaurants.map((restaurant) => (
              <Marker
                key={restaurant.id}
                position={{ lat: restaurant.lat, lng: restaurant.lng }}
                onClick={() => setSelectedRestaurant(restaurant)}
              />
            ))}

            {selectedRestaurant && (
              <InfoWindow
                position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
                onCloseClick={() => setSelectedRestaurant(null)}
              >
                <div className="w-48">
                  <img src={selectedRestaurant.imagen} alt={selectedRestaurant.nombre} className="w-full h-24 object-cover rounded mb-2" />
                  <h3 className="font-semibold text-sm mb-1">{selectedRestaurant.nombre}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{selectedRestaurant.tipo}</p>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-yellow-500">⭐ {selectedRestaurant.calificacion}</span>
                    <span className="text-muted-foreground">{selectedRestaurant.precio}</span>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => navigate("/restaurante-detalle")}>
                    Ver detalles
                  </Button>
                </div>
              </InfoWindow>
            )}

            {userLocation && (
              <Marker position={userLocation} />
            )}
          </GoogleMap>
        </LoadScript>

        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
          <Button size="icon" variant="secondary" className="shadow-lg" onClick={handleZoomIn}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="shadow-lg" onClick={handleZoomOut}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="shadow-lg" onClick={handleLocate}>
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
