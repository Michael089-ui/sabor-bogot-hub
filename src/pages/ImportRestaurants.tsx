import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { importRestaurants } from "@/scripts/importRestaurants";
import { useToast } from "@/hooks/use-toast";

export default function ImportRestaurants() {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImportFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const importResult = await importRestaurants(text);
      
      setResult(importResult);
      
      if (importResult.success) {
        toast({
          title: "Importación exitosa",
          description: importResult.message,
        });
      } else {
        toast({
          title: "Error en la importación",
          description: importResult.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setResult({ success: false, error: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportEmbedded = async () => {
    setIsImporting(true);
    setResult(null);

    try {
      const response = await fetch('/src/data/restaurants-premium.csv');
      const text = await response.text();
      const importResult = await importRestaurants(text);
      
      setResult(importResult);
      
      if (importResult.success) {
        toast({
          title: "Importación exitosa",
          description: importResult.message,
        });
      } else {
        toast({
          title: "Error en la importación",
          description: importResult.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setResult({ success: false, error: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          ← Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Importar Restaurantes Premium</CardTitle>
            <CardDescription>
              Importa los 50 restaurantes premium de Bogotá desde el archivo CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Botón para importar CSV embebido */}
            <div>
              <Button 
                onClick={handleImportEmbedded}
                disabled={isImporting}
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar CSV Embebido
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Importa el archivo restaurants-premium.csv incluido en el proyecto
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O</span>
              </div>
            </div>

            {/* Input para subir archivo CSV */}
            <div>
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Subir archivo CSV</p>
                  <p className="text-xs text-muted-foreground">
                    Haz clic para seleccionar un archivo CSV
                  </p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleImportFromFile}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>

            {/* Resultado */}
            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.success ? result.message : result.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Botón para ir a ver restaurantes */}
            {result?.success && (
              <Button 
                onClick={() => navigate('/restaurantes')}
                className="w-full"
                variant="outline"
              >
                Ver Restaurantes Importados
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Formato del CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
              <div>place_id,name,rating,address,zone,price_level,latitude,longitude,</div>
              <div>cuisine,description,min_price,max_price,currency,price_range,last_updated</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
