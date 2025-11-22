import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hasChecked, setHasChecked] = useState(false);

  console.log('🔐 ProtectedRoute - Estado:', { 
    user: !!user, 
    loading, 
    hasChecked,
    path: window.location.pathname 
  });

  useEffect(() => {
    console.log('🔐 ProtectedRoute - useEffect ejecutado');
    
    // Solo ejecutar una vez cuando la carga termine
    if (!loading && !hasChecked) {
      console.log('🔐 ProtectedRoute - Verificando autenticación...');
      
      if (!user) {
        console.log('🔐 ProtectedRoute - ❌ No hay usuario, redirigiendo a login');
        navigate("/login", { replace: true });
      } else {
        console.log('🔐 ProtectedRoute - ✅ Usuario autenticado, permitiendo acceso');
        setHasChecked(true);
      }
    }
  }, [user, loading, navigate, hasChecked]);

  if (loading) {
    console.log('🔐 ProtectedRoute - ⏳ Mostrando loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasChecked || !user) {
    console.log('🔐 ProtectedRoute - 🚫 No renderizar - no autenticado o no verificado');
    return null;
  }

  console.log('🔐 ProtectedRoute - 🎉 Renderizando children');
  return <>{children}</>;
};