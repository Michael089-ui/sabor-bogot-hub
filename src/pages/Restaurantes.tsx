import { useState, useMemo, useEffect, useRef } from "react";
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
import { useInfiniteRestaurants, formatPriceLevel, RestaurantFilters } from "@/hooks/useRestaurants";

const Restaurantes = () => {
  const navigate = useNavigate();
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [filters, setFilters] = useState<RestaurantFilters>({
    cuisine: [],
    priceLevel: [],
    neighborhood: [],
    minRating: undefined,
    openNow: undefined,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteRestaurants(filters, 12);

  // Flatten all pages into a single array
  const allRestaurants = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount || 0;

  // Intersection Observer para scroll infinito
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
  };

  const clearFilters = () => {
    setFilters({
      cuisine: [],
      priceLevel: [],
      neighborhood: [],
      minRating: undefined,
      openNow: undefined,
    });
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
              Mostrando {allRestaurants.length} de {totalCount} restaurantes
              {isFetchingNextPage && " (cargando más...)"}
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
                {filters.cuisine?.length || filters.priceLevel?.length || filters.neighborhood?.length || filters.minRating || filters.openNow
                  ? 'No se encontraron restaurantes con los filtros seleccionados.'
                  : 'No se encontraron restaurantes. Intenta realizar una búsqueda primero.'}
              </p>
              {(filters.cuisine?.length || filters.priceLevel?.length || filters.neighborhood?.length || filters.minRating || filters.openNow) && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {allRestaurants.map((restaurante) => (
                <div
                  key={restaurante.id}
                  onClick={() => handleRestauranteClick(restaurante.place_id)}
                >
                  <RestauranteCard restaurant={restaurante} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Loading indicator para scroll infinito */}
        {isFetchingNextPage && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Cargando más restaurantes...</span>
          </div>
        )}

        {/* Elemento invisible para activar la carga */}
        {hasNextPage && !isFetchingNextPage && (
          <div ref={loadMoreRef} className="h-20" />
        )}

        {/* Mensaje cuando ya no hay más resultados */}
        {!hasNextPage && allRestaurants.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Has visto todos los restaurantes disponibles ({totalCount} en total)
            </p>
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
