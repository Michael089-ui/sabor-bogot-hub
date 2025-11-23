import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Localidad {
  id_localidad: string;
  numero: number;
  nombre: string;
}

interface Barrio {
  id_barrio: string;
  nombre: string;
  id_localidad: string;
}

export const useLocalidades = () => {
  return useQuery({
    queryKey: ['localidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('localidad')
        .select('*')
        .order('numero', { ascending: true });
      
      if (error) throw error;
      return data as Localidad[];
    },
    staleTime: 1000 * 60 * 60, // Cache por 1 hora (datos estáticos)
  });
};

export const useBarriosPorLocalidad = (localidadId: string | null | undefined) => {
  return useQuery({
    queryKey: ['barrios', localidadId],
    queryFn: async () => {
      if (!localidadId) return [];
      
      const { data, error } = await supabase
        .from('barrio')
        .select('*')
        .eq('id_localidad', localidadId)
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      return data as Barrio[];
    },
    enabled: !!localidadId, // Solo ejecutar si hay localidadId
    staleTime: 1000 * 60 * 60,
  });
};
