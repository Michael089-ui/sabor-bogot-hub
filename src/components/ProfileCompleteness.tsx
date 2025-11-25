import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileCompletenessProps {
  userData: any;
  onEditProfile: () => void;
}

export const ProfileCompleteness = ({ userData, onEditProfile }: ProfileCompletenessProps) => {
  
  const completenessItems = [
    {
      id: 'nombre',
      label: 'Nombre completo',
      completed: !!(userData.nombre && userData.apellidos),
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      completed: !!userData.telefono,
    },
    {
      id: 'ubicacion',
      label: 'Ubicación (Localidad y Barrio)',
      completed: !!(userData.id_localidad && userData.id_barrio),
    },
    {
      id: 'tipo_comida',
      label: 'Preferencias de comida',
      completed: !!(userData.tipo_comida && userData.tipo_comida.length > 0),
    },
    {
      id: 'presupuesto',
      label: 'Presupuesto',
      completed: !!userData.presupuesto,
    },
    {
      id: 'foto',
      label: 'Foto de perfil',
      completed: !!userData.foto_url,
    }
  ];

  const completedCount = completenessItems.filter(item => item.completed).length;
  const totalCount = completenessItems.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressMessage = () => {
    if (percentage === 100) return '¡Perfil completo! 🎉';
    if (percentage >= 80) return 'Casi completo, ¡sigue así!';
    if (percentage >= 50) return 'Vas por buen camino';
    return 'Completa tu perfil para mejores recomendaciones';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Completitud del Perfil</span>
          <span className="text-2xl font-bold text-primary">{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de progreso */}
        <div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {getProgressMessage()}
          </p>
        </div>

        {/* Lista de items */}
        <div className="space-y-2">
          {completenessItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 text-sm"
            >
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Botón de acción */}
        {percentage < 100 && (
          <Button 
            onClick={onEditProfile}
            className="w-full mt-4"
            variant="outline"
          >
            Completar Perfil
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
