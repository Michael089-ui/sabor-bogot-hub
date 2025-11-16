import { Star, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RestauranteCardProps {
  nombre: string;
  imagen: string;
  calificacion: number;
  precio: string;
  tipo?: string;
}

export function RestauranteCard({ 
  nombre, 
  imagen, 
  calificacion, 
  precio, 
  tipo 
}: RestauranteCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer min-w-[280px]">
      <div className="relative h-40 overflow-hidden">
        <img 
          src={imagen} 
          alt={nombre} 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{nombre}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-medium text-foreground">{calificacion}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-medium">{precio}</span>
          </div>
        </div>
        {tipo && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {tipo}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
