import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Minus, Navigation, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data para restaurantes
const mockRestaurantes = [
  {
    id: 1,
    nombre: "La Cocina de Sofía",
    tipo: "Comida Colombiana",
    calificacion: 4.5,
    precio: "$$$",
    imagen: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    nombre: "El Fogón de la Abuela",
    tipo: "Comida Tradicional",
    calificacion: 4.2,
    precio: "$$",
    imagen: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    nombre: "Sabores del Pacífico",
    tipo: "Mariscos",
    calificacion: 4.7,
    precio: "$$$$",
    imagen: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop"
  },
  {
    id: 4,
    nombre: "El Rincón Paisa",
    tipo: "Comida Paisa",
    calificacion: 4.0,
    precio: "$$",
    imagen: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop"
  },
  {
    id: 5,
    nombre: "Ajiaco y Algo Más",
    tipo: "Comida Bogotana",
    calificacion: 4.3,
    precio: "$$",
    imagen: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400&h=300&fit=crop"
  }
];

const Mapa = () => {
  const navigate = useNavigate();
  const [mapSearchQuery, setMapSearchQuery] = useState("");

  return (
    <div className="flex h-full w-full bg-background">
      {/* Panel Izquierdo - Filtros y Resultados */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-4">Resultados</h1>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Tipo de comida
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Seleccionar tipo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Colombiana</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Italiana</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Mexicana</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Mariscos</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Precio
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Rango de precio</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>$ (Económico)</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>$$ (Moderado)</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>$$$ (Caro)</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>$$$$ (Muy caro)</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Ubicación
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Zona</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Chapinero</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Usaquén</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Centro</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Norte</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Calificación
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Mínima</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>4.5+ estrellas</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>4.0+ estrellas</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>3.5+ estrellas</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Disponibilidad
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Horario</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Abierto ahora</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Reservas disponibles</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Delivery</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Filtros
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Más filtros</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Pet-friendly</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Terraza</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Vegetariano</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Parqueadero</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Lista de Resultados */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {mockRestaurantes.map((restaurante) => (
              <div
                key={restaurante.id}
                className="flex gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <img
                  src={restaurante.imagen}
                  alt={restaurante.nombre}
                  className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                    {restaurante.nombre}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {restaurante.tipo}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-foreground">
                      ⭐ {restaurante.calificacion}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {restaurante.precio}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Botón CTA */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={() => navigate("/chatia")}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Recomiéndame algo
          </Button>
        </div>
      </div>

      {/* Panel Derecho - Mapa */}
      <div className="flex-1 relative bg-muted/20">
        {/* Buscador sobre el mapa */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar en el mapa..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                className="pl-9 bg-background shadow-lg border-border"
              />
            </div>
          </div>
        </div>

        {/* Área del Mapa (Placeholder) */}
        <div className="w-full h-full relative overflow-hidden">
          {/* Simulación de mapa con patrón de cuadrícula */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Texto central del placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2 bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-border">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm font-medium text-foreground">Vista de Mapa</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Aquí se mostrará el mapa interactivo con las ubicaciones de los restaurantes
              </p>
            </div>
          </div>

          {/* Marcadores simulados en el mapa */}
          <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg animate-pulse">
            📍
          </div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
            📍
          </div>
          <div className="absolute top-2/3 right-1/3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
            📍
          </div>
        </div>

        {/* Controles de Mapa */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="shadow-lg bg-background hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="shadow-lg bg-background hover:bg-accent"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        {/* Botón de Geolocalización */}
        <div className="absolute right-4 bottom-4 z-10">
          <Button
            size="icon"
            variant="secondary"
            className="shadow-lg bg-background hover:bg-accent"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Mapa;
