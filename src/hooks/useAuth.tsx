import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Si hay sesión pero no está marcado "recordarme", verificar
        if (session && !localStorage.getItem('rememberMe')) {
          // No hacer nada aquí, dejar que la sesión persista hasta cerrar navegador
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Revisar si existe la sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
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
          emailRedirectTo: `${window.location.origin}/dashboard`,
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

      toast.success('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.');
      return { error: null };
    } catch (error: any) {
      toast.error('Error al registrarse');
      return { error };
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Correo de confirmación reenviado. Revisa tu bandeja de entrada.');
      return { error: null };
    } catch (error: any) {
      toast.error('Error al reenviar el correo');
      return { error };
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciales incorrectas');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor confirma tu correo electrónico antes de iniciar sesión');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      // Verificar si el email está confirmado
      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        toast.error('Debes confirmar tu correo electrónico antes de acceder. Revisa tu bandeja de entrada.');
        return { error: new Error('Email not confirmed') };
      }

      // Guardar preferencia de "recordarme"
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      toast.success('¡Bienvenido!');
      return { error: null, user: data.user };
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

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
      return { error: null };
    } catch (error: any) {
      toast.error('Error al enviar el correo de recuperación');
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Contraseña actualizada exitosamente');
      return { error: null };
    } catch (error: any) {
      toast.error('Error al actualizar la contraseña');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Limpiar preferencia de "recordarme"
      localStorage.removeItem('rememberMe');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return { error };
      }
      toast.success('Sesión cerrada');
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
    resendConfirmationEmail,
    resetPassword,
    updatePassword,
  };
};