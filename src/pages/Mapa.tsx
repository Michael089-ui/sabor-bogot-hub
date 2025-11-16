import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Search, SlidersHorizontal, Plus, Minus, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Solucionar problema de iconos por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock data con coordenadas de Bogotá
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

// Ícono personalizado para marcadores de restaurantes
const createCustomIcon = (precio: string) => {
  const colors: Record<string, string> = {
    "$": "#22c55e",
    "$$": "#3b82f6",
    "$$$": "#f97316",
    "$$$$": "#ef4444",
  };

  const color = colors[precio] || "#3b82f6";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
        ">🍽️</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Componente para controles del mapa usando useMap hook
function MapControls({ onLocate }: { onLocate: () => void }) {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
      <Button
        size="icon"
        variant="secondary"
        className="shadow-lg"
        onClick={handleZoomIn}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="shadow-lg"
        onClick={handleZoomOut}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="shadow-lg"
        onClick={onLocate}
      >
        <Navigation className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Componente para centrar el mapa en un restaurante usando useMap
function MapUpdater({ selectedId, restaurants }: { selectedId: number | null; restaurants: typeof mockRestaurantes }) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      const restaurant = restaurants.find((r) => r.id === selectedId);
      if (restaurant) {
        setTimeout(() => {
          map.flyTo([restaurant.lat, restaurant.lng], 16, {
            duration: 1,
          });
        }, 100);
      }
    }
  }, [selectedId, restaurants, map]);

  return null;
}

// Componente para manejar la ubicación del usuario
function UserLocationMarker({ userLocation }: { userLocation: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo(userLocation, 16, {
        duration: 1,
      });
    }
  }, [userLocation, map]);

  if (!userLocation) return null;

  const userLocationIcon = L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <Marker position={userLocation} icon={userLocationIcon}>
      <Popup>Tu ubicación</Popup>
    </Marker>
  );
}

export default function Mapa() {
  const navigate = useNavigate();
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const filteredRestaurants = mockRestaurantes.filter((restaurant) =>
    restaurant.nombre.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
    restaurant.tipo.toLowerCase().includes(mapSearchQuery.toLowerCase())
  );

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Panel Izquierdo - Filtros y Resultados */}
      <div className="w-96 border-r border-border flex flex-col">
        {/* Filtros */}
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

        {/* Lista de Restaurantes */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className={`bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                  selectedRestaurant === restaurant.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
                onClick={() => setSelectedRestaurant(restaurant.id)}
              >
                <img
                  src={restaurant.imagen}
                  alt={restaurant.nombre}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-foreground mb-1">{restaurant.nombre}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="secondary" className="text-xs">
                      {restaurant.tipo}
                    </Badge>
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

        {/* Botón Recomiéndame */}
        <div className="p-4 border-t border-border">
          <Button
            className="w-full"
            onClick={() => navigate("/chatia")}
          >
            🤖 Recomiéndame algo
          </Button>
        </div>
      </div>

      {/* Panel Derecho - Mapa */}
      <div className="flex-1 relative">
        {/* Barra de Búsqueda sobre el Mapa */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-96">
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

        {/* Mapa de Leaflet */}
        <MapContainer
          center={[4.6097, -74.0817]}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
          scrollWheelZoom={true}
        >
          {(() => (
            <>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Marcadores de Restaurantes */}
              {filteredRestaurants.map((restaurant) => (
                <Marker
                  key={restaurant.id}
                  position={[restaurant.lat, restaurant.lng]}
                  icon={createCustomIcon(restaurant.precio)}
                  eventHandlers={{
                    click: () => setSelectedRestaurant(restaurant.id),
                  }}
                >
                  <Popup>
                    <div className="w-48">
                      <img
                        src={restaurant.imagen}
                        alt={restaurant.nombre}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                      <h3 className="font-semibold text-sm mb-1">{restaurant.nombre}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{restaurant.tipo}</p>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-yellow-500">⭐ {restaurant.calificacion}</span>
                        <span className="text-muted-foreground">{restaurant.precio}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => navigate("/restaurante-detalle")}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Componentes que usan useMap hook */}
              <UserLocationMarker userLocation={userLocation} />
              <MapControls onLocate={handleLocate} />
              <MapUpdater selectedId={selectedRestaurant} restaurants={filteredRestaurants} />
            </>
          )) as unknown as React.ReactNode}
        </MapContainer>
      </div>
    </div>
  );
}
