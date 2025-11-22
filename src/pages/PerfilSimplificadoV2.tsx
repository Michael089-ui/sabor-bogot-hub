// PerfilSimplificadoV2.tsx - VERSIÓN CORREGIDA
import { useState, useEffect } from "react";
import { User, LogOut, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PerfilSimplificadoV2 = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // ← Agregar authLoading
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  console.log('🎯 PerfilSimplificadoV2 - Estado:', { 
    user: user?.email, 
    authLoading, 
    componentLoading: loading 
  });

  useEffect(() => {
    console.log('🎯 PerfilSimplificadoV2 - useEffect ejecutado', { 
      user: user?.email, 
      authLoading 
    });
    
    // Esperar a que authLoading termine Y tener usuario
    if (authLoading || !user) {
      console.log('🎯 PerfilSimplificadoV2 - Esperando autenticación...');
      return;
    }

    const fetchUserData = async () => {
      try {
        console.log('🎯 PerfilSimplificadoV2 - Fetching data...');
        const { data: userProfile, error: userError } = await supabase
          .from("usuario")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        console.log('🎯 PerfilSimplificadoV2 - Resultado:', { userProfile, userError });

        if (userError) {
          console.error('🎯 PerfilSimplificadoV2 - Error:', userError);
          // Si hay error, crear perfil básico
          const baseProfile = {
            id: user.id,
            nombre: user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario",
            apellidos: user.user_metadata?.apellidos || "",
            email: user.email,
          };
          setUserData(baseProfile);
        } else {
          const baseProfile = userProfile || {
            id: user.id,
            nombre: user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario",
            apellidos: user.user_metadata?.apellidos || "",
            email: user.email,
          };
          setUserData(baseProfile);
        }
      } catch (error) {
        console.error('🎯 PerfilSimplificadoV2 - Error catch:', error);
        // En caso de error, crear perfil mínimo
        setUserData({
          id: user.id,
          nombre: user.email?.split("@")[0] || "Usuario",
          email: user.email,
        });
      } finally {
        setLoading(false);
        console.log('🎯 PerfilSimplificadoV2 - Loading false');
      }
    };

    fetchUserData();
  }, [user, authLoading, navigate]); // ← Agregar authLoading a dependencias

  // Mostrar loading si auth está cargando O el componente está cargando
  if (authLoading || loading) {
    console.log('🎯 PerfilSimplificadoV2 - Mostrando loading', { authLoading, loading });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData) {
    console.log('🎯 PerfilSimplificadoV2 - No userData');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No se pudo cargar la información del perfil.</p>
      </div>
    );
  }

  console.log('🎯 PerfilSimplificadoV2 - Renderizando contenido, userData:', userData);

  const nombreCompleto = `${userData.nombre || ''} ${userData.apellidos || ''}`.trim() || 'Usuario';

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-32 w-32 mb-4">
            <AvatarFallback className="text-3xl">
              {nombreCompleto.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {nombreCompleto}
          </h1>
          <p className="text-primary">
            {userData.email}
          </p>
        </div>

        <div className="p-4 bg-green-100 border border-green-400 rounded mb-4">
          <p className="text-green-800 font-semibold">
            ✅ Perfil Simplificado V2 funcionando
          </p>
          <p className="text-green-700 text-sm">
            UserData cargado correctamente
          </p>
        </div>

        <Button onClick={() => console.log('Datos completos:', userData)}>
          Ver datos en consola
        </Button>
      </div>
    </div>
  );
};

export default PerfilSimplificadoV2;