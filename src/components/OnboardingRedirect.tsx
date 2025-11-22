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

  // Rutas que no requieren onboarding completo
  const exemptRoutes = ["/perfil", "/configuracion"];

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!authLoading && user) {
        // Si estamos en una ruta exenta, no verificar onboarding
        if (exemptRoutes.includes(location.pathname)) {
          setChecking(false);
          return;
        }

        const isCompleted = await checkOnboardingStatus();
        if (!isCompleted) {
          navigate("/onboarding");
        }
        setChecking(false);
      } else if (!authLoading) {
        setChecking(false);
      }
    };

    checkAndRedirect();
  }, [user, authLoading, checkOnboardingStatus, navigate, location.pathname]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};
