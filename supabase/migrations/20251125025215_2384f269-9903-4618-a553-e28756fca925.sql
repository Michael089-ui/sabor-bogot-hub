-- Actualizar función handle_new_user para usar id_localidad e id_barrio
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.usuario (
    id, 
    nombre, 
    apellidos,
    email,
    telefono,
    tipo_comida,
    presupuesto,
    id_localidad,
    id_barrio,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'apellidos',
    NEW.email,
    NEW.raw_user_meta_data->>'telefono',
    CASE 
      WHEN NEW.raw_user_meta_data->>'tipo_comida' IS NOT NULL 
      THEN string_to_array(NEW.raw_user_meta_data->>'tipo_comida', ',')
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'presupuesto',
    NEW.raw_user_meta_data->>'id_localidad',
    NEW.raw_user_meta_data->>'id_barrio',
    CASE 
      WHEN NEW.raw_user_meta_data->>'tipo_comida' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'presupuesto' IS NOT NULL
        AND NEW.raw_user_meta_data->>'id_localidad' IS NOT NULL
        AND NEW.raw_user_meta_data->>'telefono' IS NOT NULL
      THEN true
      ELSE false
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error inserting user profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;