import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { testSupabaseConnection } from "@/tests/supabaseTest";

const SupabaseDebug = () => {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "success" | "error">("loading");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionData, setConnectionData] = useState<any>(null);

  useEffect(() => {
    const checkConnection = async () => {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        setConnectionStatus("success");
        setConnectionMessage("Conexión a Supabase exitosa");
        setConnectionData(result.data);
      } else {
        setConnectionStatus("error");
        setConnectionMessage(result.error || "Error desconocido");
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Debug - Supabase Connection</h1>
        
        <Card className={connectionStatus === "error" ? "border-red-500" : connectionStatus === "success" ? "border-green-500" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectionStatus === "loading" && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              {connectionStatus === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
              {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              Prueba de Conexión a Supabase
            </CardTitle>
            <CardDescription>
              Estado de la conexión con la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Estado:</strong> {connectionStatus === "loading" ? "Verificando..." : connectionStatus === "success" ? "✅ Exitosa" : "❌ Error"}
              </p>
              <p className="text-sm">
                <strong>Mensaje:</strong> {connectionMessage}
              </p>
              {connectionData && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Datos obtenidos:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(connectionData, null, 2)}
                  </pre>
                </div>
              )}
              {connectionStatus === "success" && (!connectionData || connectionData.length === 0) && (
                <p className="text-sm text-muted-foreground mt-2">
                  ℹ️ La tabla 'usuario' está vacía. Esto es normal si aún no has registrado usuarios.
                </p>
              )}
              {connectionStatus === "error" && (
                <p className="text-sm text-muted-foreground mt-2">
                  ⚠️ Verifica que las credenciales de Supabase en .env sean correctas y que la tabla 'usuario' exista.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupabaseDebug;
