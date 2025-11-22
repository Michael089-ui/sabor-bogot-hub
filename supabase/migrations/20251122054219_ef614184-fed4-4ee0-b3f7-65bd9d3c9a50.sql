-- Añadir columna para vincular búsquedas con conversaciones del chat
ALTER TABLE public.historial_busqueda 
ADD COLUMN IF NOT EXISTS id_conversacion uuid REFERENCES public.chat_conversacion(id_conversacion) ON DELETE SET NULL;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_historial_conversacion 
  ON public.historial_busqueda(id_conversacion);