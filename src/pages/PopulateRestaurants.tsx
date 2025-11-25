import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PopulateRestaurants() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  const handlePopulate = async () => {
    setIsPopulating(true);
    setProgress(null);
    
    toast.info("Iniciando población masiva de restaurantes...", {
      description: "Este proceso tomará 25-35 minutos. Puedes cerrar esta página."
    });

    try {
      const { data, error } = await supabase.functions.invoke('populate-restaurants', {
        body: {}
      });

      if (error) throw error;

      setProgress(data);
      
      if (data.success) {
        toast.success("¡Población completada exitosamente!", {
          description: `${data.newRestaurants} restaurantes nuevos agregados de ${data.totalProcessed} procesados.`
        });
      } else {
        toast.error("Hubo errores durante la población", {
          description: "Revisa los detalles abajo."
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Error al ejecutar la población", {
        description: error.message || "Error desconocido"
      });
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Población Masiva de Restaurantes</h1>
        <p className="text-muted-foreground">
          Ejecuta la población automática de miles de restaurantes de Bogotá en la base de datos local.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Información importante:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Este proceso poblará el catálogo con 4,000-6,000 restaurantes de Bogotá</li>
            <li>Durará aproximadamente 25-35 minutos</li>
            <li>Se ejecutará automáticamente cada domingo a las 3 AM</li>
            <li>Puedes cerrar esta página durante el proceso</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Ejecutar Población
          </CardTitle>
          <CardDescription>
            Llena la base de datos con restaurantes reales de todas las localidades y tipos de cocina de Bogotá
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Cobertura Total</p>
                <p className="text-sm text-muted-foreground">
                  20 localidades × 17 tipos de cocina × 20 resultados por búsqueda
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Índices Optimizados</p>
                <p className="text-sm text-muted-foreground">
                  Base de datos con índices para búsquedas ultra-rápidas
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Actualización Automática</p>
                <p className="text-sm text-muted-foreground">
                  Cron job configurado para actualizaciones semanales
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handlePopulate} 
            disabled={isPopulating}
            className="w-full"
            size="lg"
          >
            {isPopulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Poblando restaurantes... (Esto tomará ~30 min)
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Iniciar Población Masiva
              </>
            )}
          </Button>

          {progress && (
            <Card className={progress.success ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {progress.success ? "✅ Completado" : "⚠️ Completado con Errores"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Procesados</p>
                    <p className="text-2xl font-bold">{progress.totalProcessed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nuevos Agregados</p>
                    <p className="text-2xl font-bold text-green-600">{progress.newRestaurants}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duplicados</p>
                    <p className="text-2xl font-bold text-yellow-600">{progress.duplicates}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Errores</p>
                    <p className="text-2xl font-bold text-red-600">{progress.errors}</p>
                  </div>
                </div>

                {progress.errorDetails && progress.errorDetails.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Primeros errores:</p>
                    <div className="bg-muted p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                      {progress.errorDetails.map((error: string, idx: number) => (
                        <div key={idx} className="mb-1">{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
