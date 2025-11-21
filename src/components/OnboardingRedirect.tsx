import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingRedirectProps {
  children: React.ReactNode;
}

export const OnboardingRedirect = ({ children }: OnboardingRedirectProps) => {
  const { user, loading: authLoading, checkOnboardingStatus } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!authLoading && user) {
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
  }, [user, authLoading, checkOnboardingStatus, navigate]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};
