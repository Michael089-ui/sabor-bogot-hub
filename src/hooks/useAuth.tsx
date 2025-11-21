import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (data: {
    email: string;
    password: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    tipo_comida: string[];
    presupuesto: string;
    ubicacion: string;
  }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nombre: data.nombre,
            apellidos: data.apellidos,
            telefono: data.telefono,
            tipo_comida: data.tipo_comida.join(','),
            presupuesto: data.presupuesto,
            ubicacion: data.ubicacion,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este correo ya está registrado');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      toast.success('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
      navigate('/login');
      return { error: null };
    } catch (error: any) {
      toast.error('Error al registrarse');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciales incorrectas');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      toast.success('¡Bienvenido!');
      navigate('/dashboard');
      return { error: null };
    } catch (error: any) {
      toast.error('Error al iniciar sesión');
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      toast.error('Error al iniciar sesión con Google');
      return { error };
    }
  };

  const checkOnboardingStatus = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return false;
      }

      return data?.onboarding_completed ?? false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return { error };
      }
      toast.success('Sesión cerrada');
      navigate('/login');
      return { error: null };
    } catch (error: any) {
      toast.error('Error al cerrar sesión');
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    checkOnboardingStatus,
  };
};
