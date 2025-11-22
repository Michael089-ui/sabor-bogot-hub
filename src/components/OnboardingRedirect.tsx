import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

export const OnboardingRedirect = ({ children }: OnboardingRedirectProps) => {
  const { user, loading: authLoading, checkOnboardingStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  console.log('OnboardingRedirect - Estado:', {
    user: !!user,
    authLoading,
    location: location.pathname,
    checking
  });

  useEffect(() => {
    // Si no hay usuario o todavía está cargando, no hacer nada
    if (authLoading || !user) {
      if (!authLoading && !user) {
        setChecking(false);
      }
      return;
    }

    const checkOnboarding = async () => {
      console.log('Verificando onboarding para ruta:', location.pathname);
      
      // Rutas que NO requieren onboarding completado
      const exemptRoutes = ["/perfil", "/configuracion", "/onboarding"];
      
      if (exemptRoutes.includes(location.pathname)) {
        console.log('Ruta exenta, permitiendo acceso');
        setChecking(false);
        return;
      }

      try {
        const isCompleted = await checkOnboardingStatus();
        console.log('Onboarding completado?:', isCompleted);
        
        if (!isCompleted) {
          console.log('Redirigiendo a onboarding');
          navigate("/onboarding", { replace: true });
        } else {
          console.log('Onboarding OK, permitiendo acceso');
          setChecking(false);
        }
      } catch (error) {
        console.error('Error verificando onboarding:', error);
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user, authLoading, location.pathname, checkOnboardingStatus, navigate]);

  if (authLoading || checking) {
    console.log('Mostrando loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('Renderizando children para:', location.pathname);
  return <>{children}</>;
};