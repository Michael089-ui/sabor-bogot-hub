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

  // Mock data - favoritos del usuario
  const favoritos = [
    {
      id: 1,
      nombre: "El Fogón de Doña Rosa",
      imagen: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop",
      calificacion: 4.5,
      precio: "$$",
      tipo: "Tradicional Colombiana"
    },
    {
      id: 2,
      nombre: "La Puerta Falsa",
      imagen: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop",
      calificacion: 4.8,
      precio: "$",
      tipo: "Desayunos"
    },
    {
      id: 3,
      nombre: "Andrés Carne de Res",
      imagen: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop",
      calificacion: 4.6,
      precio: "$$$",
      tipo: "Parrilla"
    },
    {
      id: 4,
      nombre: "Crepes & Waffles",
      imagen: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&auto=format&fit=crop",
      calificacion: 4.3,
      precio: "$$",
      tipo: "Internacional"
    },
    {
      id: 5,
      nombre: "Leo Cocina y Cava",
      imagen: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop",
      calificacion: 4.9,
      precio: "$$$$",
      tipo: "Alta Cocina"
    },
    {
      id: 6,
      nombre: "Criterion",
      imagen: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&auto=format&fit=crop",
      calificacion: 4.7,
      precio: "$$$",
      tipo: "Francesa"
    },
  ];

  const handleRemoveFavorite = (id: number) => {
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
                      nombre={restaurante.nombre}
                      imagen={restaurante.imagen}
                      calificacion={restaurante.calificacion}
                      precio={restaurante.precio}
                      tipo={restaurante.tipo}
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
