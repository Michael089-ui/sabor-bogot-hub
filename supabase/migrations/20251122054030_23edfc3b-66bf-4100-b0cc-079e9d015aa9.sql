-- Corregir función para tener search_path seguro
CREATE OR REPLACE FUNCTION public.update_chat_conversacion_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversacion
  SET fecha_actualizacion = now()
  WHERE id_conversacion = NEW.id_conversacion;
  RETURN NEW;
END;
$$;