import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronDown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestauranteCard } from "@/components/RestauranteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { QuickRecommendationModal } from "@/components/QuickRecommendationModal";
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
import { useRestaurants, getPhotoUrl, formatPriceLevel, RestaurantFilters } from "@/hooks/useRestaurants";

const Restaurantes = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [filters, setFilters] = useState<RestaurantFilters>({
    cuisine: [],
    priceLevel: [],
    neighborhood: [],
    minRating: undefined,
    openNow: undefined,
  });

  const itemsPerPage = 12;
  const { data: allRestaurants, isLoading, error } = useRestaurants(undefined, filters);

  // Paginación en el cliente
  const paginatedRestaurants = useMemo(() => {
    if (!allRestaurants) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allRestaurants.slice(startIndex, endIndex);
  }, [allRestaurants, currentPage]);

  const totalPages = useMemo(() => {
    if (!allRestaurants) return 0;
    return Math.ceil(allRestaurants.length / itemsPerPage);
  }, [allRestaurants]);

  const handleRestauranteClick = (placeId: string) => {
    navigate(`/restaurantes/${placeId}`);
  };

  const toggleFilter = (filterType: keyof RestaurantFilters, value: any) => {
    setFilters(prev => {
      if (filterType === 'minRating') {
        return { ...prev, minRating: prev.minRating === value ? undefined : value };
      }
      if (filterType === 'openNow') {
        return { ...prev, openNow: prev.openNow === value ? undefined : value };
      }
      
      const currentArray = (prev[filterType] as any[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      
      return { ...prev, [filterType]: newArray };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      cuisine: [],
      priceLevel: [],
      neighborhood: [],
      minRating: undefined,
      openNow: undefined,
    });
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.cuisine?.length) count += filters.cuisine.length;
    if (filters.priceLevel?.length) count += filters.priceLevel.length;
    if (filters.neighborhood?.length) count += filters.neighborhood.length;
    if (filters.minRating) count += 1;
    if (filters.openNow) count += 1;
    return count;
  }, [filters]);

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
            onClick={() => setShowRecommendationModal(true)}
            className="gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Recomiéndame algo
          </Button>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 p-4 bg-card border border-border rounded-lg">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Tipo de comida {filters.cuisine && filters.cuisine.length > 0 && `(${filters.cuisine.length})`}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Seleccionar tipo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={filters.cuisine?.includes("Colombian")}
                  onCheckedChange={() => toggleFilter("cuisine", "Colombian")}
                >
                  Colombiana
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.cuisine?.includes("Italian")}
                  onCheckedChange={() => toggleFilter("cuisine", "Italian")}
                >
                  Italiana
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.cuisine?.includes("Asian")}
                  onCheckedChange={() => toggleFilter("cuisine", "Asian")}
                >
                  Asiática
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.cuisine?.includes("Steakhouse")}
                  onCheckedChange={() => toggleFilter("cuisine", "Steakhouse")}
                >
                  Parrilla
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Precio {filters.priceLevel && filters.priceLevel.length > 0 && `(${filters.priceLevel.length})`}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Rango de precio</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={filters.priceLevel?.includes("1")}
                  onCheckedChange={() => toggleFilter("priceLevel", "1")}
                >
                  $ (Económico)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.priceLevel?.includes("2")}
                  onCheckedChange={() => toggleFilter("priceLevel", "2")}
                >
                  $$ (Moderado)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.priceLevel?.includes("3")}
                  onCheckedChange={() => toggleFilter("priceLevel", "3")}
                >
                  $$$ (Caro)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.priceLevel?.includes("4")}
                  onCheckedChange={() => toggleFilter("priceLevel", "4")}
                >
                  $$$$ (Muy caro)
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Ubicación {filters.neighborhood && filters.neighborhood.length > 0 && `(${filters.neighborhood.length})`}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Zona</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={filters.neighborhood?.includes("Chapinero Alto")}
                  onCheckedChange={() => toggleFilter("neighborhood", "Chapinero Alto")}
                >
                  Chapinero Alto
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.neighborhood?.includes("Zona G")}
                  onCheckedChange={() => toggleFilter("neighborhood", "Zona G")}
                >
                  Zona G
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.neighborhood?.includes("Usaquén")}
                  onCheckedChange={() => toggleFilter("neighborhood", "Usaquén")}
                >
                  Usaquén
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.neighborhood?.includes("La Candelaria")}
                  onCheckedChange={() => toggleFilter("neighborhood", "La Candelaria")}
                >
                  La Candelaria
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Calificación {filters.minRating && "(1)"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Mínima</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={filters.minRating === 4.5}
                  onCheckedChange={() => toggleFilter("minRating", 4.5)}
                >
                  4.5+ estrellas
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.minRating === 4.0}
                  onCheckedChange={() => toggleFilter("minRating", 4.0)}
                >
                  4.0+ estrellas
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={filters.minRating === 3.5}
                  onCheckedChange={() => toggleFilter("minRating", 3.5)}
                >
                  3.5+ estrellas
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  Disponibilidad {filters.openNow && "(1)"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Horario</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={filters.openNow === true}
                  onCheckedChange={() => toggleFilter("openNow", true)}
                >
                  Abierto ahora
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Limpiar filtros ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Contador de resultados */}
          {!isLoading && allRestaurants && (
            <p className="text-sm text-muted-foreground px-1">
              Mostrando {paginatedRestaurants.length} de {allRestaurants.length} restaurantes
            </p>
          )}
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
          ) : !allRestaurants || allRestaurants.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                No se encontraron restaurantes. Intenta realizar una búsqueda primero.
              </p>
            </div>
          ) : paginatedRestaurants.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                No se encontraron restaurantes con los filtros seleccionados.
              </p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            paginatedRestaurants.map((restaurante) => {
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
                  <RestauranteCard restaurant={restaurante} />
                </div>
              );
            })
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="py-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink 
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Modal de recomendación rápida */}
      <QuickRecommendationModal
        open={showRecommendationModal}
        onOpenChange={setShowRecommendationModal}
        restaurants={allRestaurants || []}
        currentFilters={filters}
      />
    </div>
  );
};

export default Restaurantes;
