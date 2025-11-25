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

    try {
      const { data, error } = await supabase.functions.invoke('populate-restaurants', {
        body: {}
      });

      if (error) throw error;

      setProgress(data);
      
      toast.success("¡Proceso iniciado en background!", {
        description: "El proceso tomará 25-35 minutos. Puedes cerrar esta página y revisar los logs para ver el progreso.",
        duration: 8000
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Error al iniciar la población", {
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
            <li>Durará aproximadamente 25-35 minutos ejecutándose en background</li>
            <li><strong>Puedes cerrar esta página</strong> - el proceso continuará en el servidor</li>
            <li>Se ejecutará automáticamente cada domingo a las 3 AM</li>
            <li>Revisa los logs del Edge Function para ver el progreso en tiempo real</li>
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
                Iniciando proceso en background...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Iniciar Población Masiva en Background
              </>
            )}
          </Button>

          {progress && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="text-lg">
                  ✅ Proceso Iniciado en Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>El proceso está ejecutándose en el servidor.</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Duración estimada: 25-35 minutos</li>
                      <li>Puedes cerrar esta página - el proceso continuará</li>
                      <li>Revisa los logs para ver el progreso en tiempo real</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Monitoreo del progreso:</p>
                  <a
                    href={progress.logsUrl || 'https://supabase.com/dashboard/project/ozladdazcubyvmgdpyop/functions/populate-restaurants/logs'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Database className="h-4 w-4" />
                    Ver Logs del Edge Function en Tiempo Real →
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Los logs mostrarán el progreso detallado: localidades procesadas, restaurantes agregados, y resumen final.
                  </p>
                </div>

                {progress.message && (
                  <div className="bg-muted p-3 rounded text-sm">
                    {progress.message}
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
