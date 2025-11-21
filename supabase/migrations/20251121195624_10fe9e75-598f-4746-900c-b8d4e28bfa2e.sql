-- Agregar campo onboarding_completed a la tabla usuario
ALTER TABLE public.usuario
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Modificar trigger para permitir NULL en campos opcionales y manejar onboarding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuario (
    id, 
    nombre, 
    apellidos,
    email,
    telefono,
    tipo_comida,
    presupuesto,
    ubicacion,
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
    NEW.raw_user_meta_data->>'ubicacion',
    CASE 
      WHEN NEW.raw_user_meta_data->>'tipo_comida' IS NOT NULL 
      THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$$;