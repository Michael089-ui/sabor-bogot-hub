-- Tabla para almacenar conversaciones del chat IA
CREATE TABLE IF NOT EXISTS public.chat_conversacion (
  id_conversacion uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text,
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_actualizacion timestamp with time zone DEFAULT now()
);

-- Tabla para almacenar mensajes individuales de cada conversación
CREATE TABLE IF NOT EXISTS public.chat_mensaje (
  id_mensaje uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_conversacion uuid NOT NULL REFERENCES public.chat_conversacion(id_conversacion) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  metadata jsonb
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_conversacion_usuario 
  ON public.chat_conversacion(id_usuario, fecha_actualizacion DESC);

CREATE INDEX IF NOT EXISTS idx_chat_mensaje_conversacion 
  ON public.chat_mensaje(id_conversacion, timestamp ASC);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.chat_conversacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_mensaje ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_conversacion
CREATE POLICY "Usuarios pueden ver sus propias conversaciones"
  ON public.chat_conversacion
  FOR SELECT
  USING (auth.uid() = id_usuario);

CREATE POLICY "Usuarios pueden crear sus propias conversaciones"
  ON public.chat_conversacion
  FOR INSERT
  WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Usuarios pueden actualizar sus propias conversaciones"
  ON public.chat_conversacion
  FOR UPDATE
  USING (auth.uid() = id_usuario);

CREATE POLICY "Usuarios pueden eliminar sus propias conversaciones"
  ON public.chat_conversacion
  FOR DELETE
  USING (auth.uid() = id_usuario);

-- Políticas RLS para chat_mensaje
CREATE POLICY "Usuarios pueden ver mensajes de sus conversaciones"
  ON public.chat_mensaje
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversacion
      WHERE chat_conversacion.id_conversacion = chat_mensaje.id_conversacion
        AND chat_conversacion.id_usuario = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden crear mensajes en sus conversaciones"
  ON public.chat_mensaje
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversacion
      WHERE chat_conversacion.id_conversacion = chat_mensaje.id_conversacion
        AND chat_conversacion.id_usuario = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar mensajes de sus conversaciones"
  ON public.chat_mensaje
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversacion
      WHERE chat_conversacion.id_conversacion = chat_mensaje.id_conversacion
        AND chat_conversacion.id_usuario = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar mensajes de sus conversaciones"
  ON public.chat_mensaje
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversacion
      WHERE chat_conversacion.id_conversacion = chat_mensaje.id_conversacion
        AND chat_conversacion.id_usuario = auth.uid()
    )
  );

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION public.update_chat_conversacion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversacion
  SET fecha_actualizacion = now()
  WHERE id_conversacion = NEW.id_conversacion;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar fecha_actualizacion cuando se añaden mensajes
CREATE TRIGGER update_conversacion_timestamp
  AFTER INSERT ON public.chat_mensaje
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_conversacion_timestamp();