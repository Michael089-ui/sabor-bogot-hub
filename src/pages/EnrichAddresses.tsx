import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EnrichAddresses = () => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const enrichAddresses = async () => {
    setIsEnriching(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('enrich-addresses', {
        body: {}
      });

      if (error) throw error;

      setResult(data);
      toast.success(`✅ ${data.enriched} restaurantes mejorados`);
    } catch (error) {
      console.error('Error enriching addresses:', error);
      toast.error('Error al mejorar direcciones');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enriquecer Direcciones</h1>
          <p className="text-muted-foreground mt-1">
            Mejora la precisión de direcciones usando Geocoding API y Place Details API
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mejorar Direcciones de Restaurantes
            </CardTitle>
            <CardDescription>
              Este proceso utilizará las APIs de Google Maps para:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Obtener direcciones precisas usando Geocoding API (coordenadas → dirección)</li>
                <li>Enriquecer información con Place Details API (fotos, horarios, teléfono)</li>
                <li>Actualizar barrios/vecindarios específicos</li>
                <li>Mejorar la calidad general de los datos</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={enrichAddresses} 
              disabled={isEnriching}
              size="lg"
              className="w-full"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Iniciar Proceso de Enriquecimiento
                </>
              )}
            </Button>

            {result && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Proceso Completado</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Total procesados: {result.total}</p>
                  <p>• Enriquecidos: {result.enriched}</p>
                  <p>• Errores: {result.errors}</p>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground border-t pt-4">
              <strong>Nota:</strong> Este proceso puede tomar varios minutos dependiendo 
              de la cantidad de restaurantes. Se aplicará un pequeño delay entre 
              requests para evitar límites de tasa de las APIs.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnrichAddresses;
