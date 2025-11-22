import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PerfilDebug = () => {
  const { user } = useAuth();

  console.log('👤 PerfilDebug - Renderizando, usuario:', user?.email);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Perfil Debug</h1>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Información del usuario:</h2>
                <p>Email: {user?.email || 'No user'}</p>
                <p>ID: {user?.id || 'No ID'}</p>
              </div>
              
              <Button onClick={() => console.log('Botón funcionando')}>
                Botón de prueba
              </Button>
              
              <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
                <p className="text-yellow-800">
                  Si puedes ver esta página, el problema no es el ProtectedRoute.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerfilDebug;