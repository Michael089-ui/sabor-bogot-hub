import { supabase } from "@/integrations/supabase/client";

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("usuario")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error de Supabase:", error.message);
      return { success: false, error: error.message };
    }

    console.log("Conexión a Supabase exitosa");
    console.log("Datos obtenidos:", data);
    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error de Supabase:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Ejecutar la prueba automáticamente si se importa este archivo
testSupabaseConnection();
