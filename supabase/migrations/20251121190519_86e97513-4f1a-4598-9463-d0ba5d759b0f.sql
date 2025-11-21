-- Agregar campos adicionales a la tabla usuario
ALTER TABLE public.usuario
ADD COLUMN IF NOT EXISTS apellidos character varying(255),
ADD COLUMN IF NOT EXISTS telefono character varying(20),
ADD COLUMN IF NOT EXISTS tipo_comida text[],
ADD COLUMN IF NOT EXISTS presupuesto character varying(50),
ADD COLUMN IF NOT EXISTS ubicacion text,
ADD COLUMN IF NOT EXISTS email character varying(255);

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuario_email ON public.usuario(email);

-- Crear función para manejar nuevos usuarios
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
    ubicacion
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellidos',
    NEW.email,
    NEW.raw_user_meta_data->>'telefono',
    CASE 
      WHEN NEW.raw_user_meta_data->>'tipo_comida' IS NOT NULL 
      THEN string_to_array(NEW.raw_user_meta_data->>'tipo_comida', ',')
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'presupuesto',
    NEW.raw_user_meta_data->>'ubicacion'
  );
  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger para nuevos usuarios
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Actualizar política RLS para permitir inserción durante registro
DROP POLICY IF EXISTS "Usuarios pueden crear su perfil" ON public.usuario;
CREATE POLICY "Usuarios pueden crear su perfil"
  ON public.usuario
  FOR INSERT
  WITH CHECK (auth.uid() = id);