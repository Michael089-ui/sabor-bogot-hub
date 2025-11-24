import { Heart, Trash2 } from "lucide-react";
import { RestauranteCard } from "@/components/RestauranteCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Favoritos = () => {
  const navigate = useNavigate();

  // Mock data - favoritos del usuario - falta consultar API de reseñas para crear esto - no prioritario
  const favoritos = [
    {
      id: "1",
      place_id: "fav-1",
      name: "El Fogón de Doña Rosa",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "La Candelaria",
      rating: 4.5,
      user_ratings_total: 90,
      price_level: "2",
      photos: null,
      location: null,
      types: ["Tradicional Colombiana"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 25000,
      max_price: 50000,
      currency: "COP",
      description: null,
      cuisine: "Tradicional Colombiana"
    },
    {
      id: "2",
      place_id: "fav-2",
      name: "La Puerta Falsa",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "La Candelaria",
      rating: 4.8,
      user_ratings_total: 150,
      price_level: "1",
      photos: null,
      location: null,
      types: ["Desayunos"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 10000,
      max_price: 25000,
      currency: "COP",
      description: null,
      cuisine: "Desayunos"
    },
    {
      id: "3",
      place_id: "fav-3",
      name: "Andrés Carne de Res",
      formatted_address: "Chía, Cundinamarca",
      neighborhood: "Chía",
      rating: 4.6,
      user_ratings_total: 200,
      price_level: "3",
      photos: null,
      location: null,
      types: ["Parrilla"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 50000,
      max_price: 100000,
      currency: "COP",
      description: null,
      cuisine: "Parrilla"
    },
    {
      id: "4",
      place_id: "fav-4",
      name: "Crepes & Waffles",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "Zona Rosa",
      rating: 4.3,
      user_ratings_total: 180,
      price_level: "2",
      photos: null,
      location: null,
      types: ["Internacional"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 25000,
      max_price: 50000,
      currency: "COP",
      description: null,
      cuisine: "Internacional"
    },
    {
      id: "5",
      place_id: "fav-5",
      name: "Leo Cocina y Cava",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "Chapinero Alto",
      rating: 4.9,
      user_ratings_total: 220,
      price_level: "4",
      photos: null,
      location: null,
      types: ["Alta Cocina"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 150000,
      max_price: 300000,
      currency: "COP",
      description: null,
      cuisine: "Alta Cocina"
    },
    {
      id: "6",
      place_id: "fav-6",
      name: "Criterion",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "Usaquén",
      rating: 4.7,
      user_ratings_total: 170,
      price_level: "3",
      photos: null,
      location: null,
      types: ["Francesa"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 80000,
      max_price: 150000,
      currency: "COP",
      description: null,
      cuisine: "Francesa"
    }
  ];

  const handleRemoveFavorite = (id: string) => {
    // TODO: Conectar con la tabla favorito
    console.log("Eliminar favorito:", id);
  };

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Mis Restaurantes Favoritos
            </h1>
          </div>
          <p className="text-muted-foreground">
            Guarda tus lugares favoritos para visitarlos después
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {favoritos.length > 0 ? (
          <>
            {/* Stats Card */}
            <Card className="mb-8 bg-muted/50">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Favoritos</p>
                    <p className="text-3xl font-bold text-foreground">{favoritos.length}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/restaurantes')}
                  >
                    Descubrir más restaurantes
                  </Button>
                </div>
              </div>
            </Card>

            {/* Grid de Favoritos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {favoritos.map((restaurante) => (
                <div key={restaurante.id} className="relative group">
                  <div onClick={() => navigate('/restaurante-detalle')}>
                    <RestauranteCard
                      restaurant={restaurante}
                    />
                  </div>
                  
                  {/* Botón de eliminar */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(restaurante.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </>
        ) : (
          // Estado vacío
          <Card className="p-12">
            <div className="text-center max-w-md mx-auto">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aún no tienes favoritos
              </h3>
              <p className="text-muted-foreground mb-6">
                Explora restaurantes y guarda tus favoritos para acceder fácilmente a ellos
              </p>
              <Button onClick={() => navigate('/restaurantes')}>
                Explorar Restaurantes
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Favoritos;
