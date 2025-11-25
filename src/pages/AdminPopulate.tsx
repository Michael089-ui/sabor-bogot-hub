import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface PopulateResult {
  success: boolean;
  totalProcessed: number;
  newRestaurants: number;
  duplicates: number;
  errors: number;
  errorDetails?: string[];
}

const AdminPopulate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PopulateResult | null>(null);
  const [currentStats, setCurrentStats] = useState({ total: 0, byNeighborhood: [] });
  const { toast } = useToast();

  const fetchCurrentStats = async () => {
    const { count } = await supabase
      .from('restaurant_cache')
      .select('*', { count: 'exact', head: true })
      .or('formatted_address.ilike.%Bogotá%,formatted_address.ilike.%Colombia%');

    const { data: neighborhoods } = await supabase
      .from('restaurant_cache')
      .select('neighborhood')
      .or('formatted_address.ilike.%Bogotá%,formatted_address.ilike.%Colombia%')
      .not('neighborhood', 'is', null);

    const neighborhoodCounts = (neighborhoods || []).reduce((acc: any, { neighborhood }: any) => {
      acc[neighborhood] = (acc[neighborhood] || 0) + 1;
      return acc;
    }, {});

    setCurrentStats({
      total: count || 0,
      byNeighborhood: Object.entries(neighborhoodCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10)
    });
  };

  const handlePopulate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      toast({
        title: "Iniciando población",
        description: "Este proceso puede tardar varios minutos...",
      });

      const { data, error } = await supabase.functions.invoke('populate-restaurants', {
        body: {}
      });

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast({
          title: "✅ Población completada",
          description: `Se agregaron ${data.newRestaurants} restaurantes nuevos`,
        });
      } else {
        toast({
          title: "⚠️ Población completada con errores",
          description: `Se agregaron ${data.newRestaurants} restaurantes, ${data.errors} errores`,
          variant: "destructive"
        });
      }

      // Actualizar estadísticas
      await fetchCurrentStats();

    } catch (error) {
      console.error('Error ejecutando población:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar estadísticas al montar
  useState(() => {
    fetchCurrentStats();
  });

  return (
    <div className="min-h-full p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Población de Restaurantes</h1>
          <p className="text-muted-foreground mt-1">
            Herramienta administrativa para poblar la base de datos con restaurantes de Bogotá
          </p>
        </div>

        {/* Estadísticas actuales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Estadísticas Actuales
            </CardTitle>
            <CardDescription>Estado actual de la base de datos de restaurantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Total de Restaurantes</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {currentStats.total}
              </Badge>
            </div>

            {currentStats.byNeighborhood.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Top 10 Zonas</h4>
                <div className="space-y-2">
                  {currentStats.byNeighborhood.map((item: any, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta función buscará restaurantes en las 20 localidades de Bogotá con diferentes tipos de cocina.
            El proceso buscará aproximadamente 50 restaurantes por ejecución (10 localidades × 5 tipos de cocina × ~1 restaurante promedio).
            Puedes ejecutarla múltiples veces para ir poblando más la base de datos.
          </AlertDescription>
        </Alert>

        {/* Botón de ejecución */}
        <Card>
          <CardHeader>
            <CardTitle>Ejecutar Población</CardTitle>
            <CardDescription>
              Esto consultará la API de Google Places y agregará restaurantes a la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handlePopulate} 
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Poblando base de datos...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Iniciar Población
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                Resultados de la Ejecución
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.newRestaurants}</div>
                  <div className="text-sm text-muted-foreground">Nuevos restaurantes</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{result.totalProcessed}</div>
                  <div className="text-sm text-muted-foreground">Total procesados</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground">{result.duplicates}</div>
                  <div className="text-sm text-muted-foreground">Duplicados (ya existían)</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{result.errors}</div>
                  <div className="text-sm text-muted-foreground">Errores</div>
                </div>
              </div>

              {result.errorDetails && result.errorDetails.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Detalles de Errores</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {result.errorDetails.map((error, index) => (
                      <div key={index} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Progress value={result.newRestaurants > 0 ? 100 : 0} className="h-2" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPopulate;
