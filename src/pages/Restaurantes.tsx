import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestauranteCard } from "@/components/RestauranteCard";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useRestaurants, getPhotoUrl, formatPriceLevel } from "@/hooks/useRestaurants";

const Restaurantes = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: restaurantes, isLoading, error } = useRestaurants(20);

  const handleRestauranteClick = (placeId: string) => {
    navigate(`/restaurantes/${placeId}`);
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
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                Error al cargar restaurantes. Por favor intenta de nuevo.
              </p>
            </div>
          ) : !restaurantes || restaurantes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                No se encontraron restaurantes. Intenta realizar una búsqueda primero.
              </p>
            </div>
          ) : (
            restaurantes.map((restaurante) => {
              const photoUrl = restaurante.photos && restaurante.photos.length > 0
                ? getPhotoUrl(restaurante.photos[0], 400)
                : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop";
              
              const tipo = restaurante.types && restaurante.types.length > 0
                ? restaurante.types[0].replace(/_/g, " ")
                : "Restaurante";

              return (
                <div
                  key={restaurante.id}
                  onClick={() => handleRestauranteClick(restaurante.place_id)}
                >
                  <RestauranteCard
                    nombre={restaurante.name}
                    imagen={photoUrl}
                    calificacion={restaurante.rating || 0}
                    precio={formatPriceLevel(restaurante.price_level)}
                    tipo={tipo}
                  />
                </div>
              );
            })
          )}
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
