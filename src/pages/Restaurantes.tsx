import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestauranteCard } from "@/components/RestauranteCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  },
  {
    id: 6,
    nombre: "Steakhouse Premium",
    tipo: "Carnes",
    calificacion: 4.8,
    precio: "$$$$",
    imagen: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop"
  },
  {
    id: 7,
    nombre: "Pasta Italia",
    tipo: "Italiana",
    calificacion: 4.4,
    precio: "$$$",
    imagen: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop"
  },
  {
    id: 8,
    nombre: "Sushi Zen",
    tipo: "Japonesa",
    calificacion: 4.6,
    precio: "$$$$",
    imagen: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop"
  },
  {
    id: 9,
    nombre: "Taquería El Sol",
    tipo: "Mexicana",
    calificacion: 4.1,
    precio: "$$",
    imagen: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop"
  },
];

const Restaurantes = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const handleRestauranteClick = (id: number) => {
    navigate(`/restaurante-detalle`);
  };

  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Restaurantes</h1>
            <p className="text-muted-foreground mt-1">
              Descubre los mejores restaurantes de Bogotá
            </p>
          </div>
          <Button
            onClick={() => navigate("/chatia")}
            className="gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Recomiéndame algo
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 p-4 bg-card border border-border rounded-lg">
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

        {/* Grid de Restaurantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRestaurantes.map((restaurante) => (
            <div
              key={restaurante.id}
              onClick={() => handleRestauranteClick(restaurante.id)}
            >
              <RestauranteCard
                nombre={restaurante.nombre}
                imagen={restaurante.imagen}
                calificacion={restaurante.calificacion}
                precio={restaurante.precio}
                tipo={restaurante.tipo}
              />
            </div>
          ))}
        </div>

        {/* Paginación */}
        <div className="py-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive={currentPage === 1}>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive={currentPage === 2}>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive={currentPage === 3}>
                  3
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default Restaurantes;
