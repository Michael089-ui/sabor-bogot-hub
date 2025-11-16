import { Star, MessageSquare, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ResenaCardProps {
  id: number;
  restaurante: string;
  calificacion: number;
  comentario: string;
  fecha: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const ResenaCard = ({ 
  id, 
  restaurante, 
  calificacion, 
  comentario, 
  fecha,
  onEdit,
  onDelete 
}: ResenaCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {restaurante}
            </h3>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-4 w-4 ${
                      star <= calificacion 
                        ? 'fill-yellow-500 text-yellow-500' 
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <Badge variant="secondary" className="text-xs">
                {fecha}
              </Badge>
            </div>
            
            <p className="text-muted-foreground">
              {comentario}
            </p>
          </div>

          <div className="flex md:flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(id)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(id)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Resenas = () => {
  const navigate = useNavigate();

  // Mock data - reseñas del usuario
  const resenas = [
    {
      id: 1,
      restaurante: "El Fogón de Doña Rosa",
      calificacion: 5,
      comentario: "Excelente comida tradicional colombiana. El ajiaco es increíble, con todos los ingredientes frescos y un sabor auténtico. El ambiente es muy acogedor y el servicio excepcional.",
      fecha: "Hace 2 días"
    },
    {
      id: 2,
      restaurante: "La Puerta Falsa",
      calificacion: 4,
      comentario: "Un lugar emblemático de Bogotá. El chocolate con queso y las almojábanas son deliciosos. Perfecto para desayunar. Solo le falta un poco más de espacio.",
      fecha: "Hace 1 semana"
    },
    {
      id: 3,
      restaurante: "Andrés Carne de Res",
      calificacion: 5,
      comentario: "Experiencia única en Bogotá. La comida es excelente, especialmente las carnes. El ambiente es muy animado y la decoración es espectacular. Ideal para celebraciones.",
      fecha: "Hace 2 semanas"
    },
    {
      id: 4,
      restaurante: "Leo Cocina y Cava",
      calificacion: 5,
      comentario: "Alta cocina colombiana en su mejor expresión. Cada plato es una obra de arte. El servicio es impecable y la carta de vinos excepcional. Totalmente recomendado.",
      fecha: "Hace 1 mes"
    },
  ];

  const handleEditResena = (id: number) => {
    // TODO: Conectar con la tabla reseña
    console.log("Editar reseña:", id);
  };

  const handleDeleteResena = (id: number) => {
    // TODO: Conectar con la tabla reseña
    console.log("Eliminar reseña:", id);
  };

  const handleNewResena = () => {
    navigate('/restaurantes');
  };

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Mis Reseñas y Contribuciones
                </h1>
              </div>
              <p className="text-muted-foreground">
                Comparte tu experiencia y ayuda a otros a descubrir los mejores lugares
              </p>
            </div>
            
            <Button 
              size="lg"
              onClick={handleNewResena}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Escribir nueva reseña
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {resenas.length > 0 ? (
          <>
            {/* Stats Card */}
            <Card className="mb-8 bg-muted/50">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Reseñas</p>
                    <p className="text-3xl font-bold text-foreground">{resenas.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Calificación Promedio</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-foreground">4.8</p>
                      <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Restaurantes Visitados</p>
                    <p className="text-3xl font-bold text-foreground">12</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lista de Reseñas */}
            <div className="space-y-4">
              {resenas.map((resena) => (
                <ResenaCard
                  key={resena.id}
                  id={resena.id}
                  restaurante={resena.restaurante}
                  calificacion={resena.calificacion}
                  comentario={resena.comentario}
                  fecha={resena.fecha}
                  onEdit={handleEditResena}
                  onDelete={handleDeleteResena}
                />
              ))}
            </div>
          </>
        ) : (
          // Estado vacío
          <Card className="p-12">
            <div className="text-center max-w-md mx-auto">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aún no has escrito reseñas
              </h3>
              <p className="text-muted-foreground mb-6">
                Comparte tu experiencia en los restaurantes que has visitado y ayuda a la comunidad
              </p>
              <Button onClick={handleNewResena} className="gap-2">
                <Plus className="h-4 w-4" />
                Escribir mi primera reseña
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Resenas;
