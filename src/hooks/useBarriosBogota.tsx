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
      console.log('🔄 Iniciando carga de localidades desde Supabase...');
      
      try {
        const { data, error, status, count } = await supabase
          .from('localidad')
          .select('*', { count: 'exact' })
          .order('numero', { ascending: true });

        if (error) {
          console.error('❌ Error de Supabase:', error);
          throw error;
        }

        console.log('✅ Localidades cargadas exitosamente:', data?.length);
        return data as Localidad[] || [];
      } catch (error) {
        console.error('💥 Error fatal cargando localidades:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60,
  });
};

export const useBarriosPorLocalidad = (localidadId: string | null | undefined) => {
  return useQuery({
    queryKey: ['barrios', localidadId],
    queryFn: async () => {
      console.log('🔄 Cargando barrios para localidad:', localidadId);
      
      if (!localidadId) {
        console.log('❌ No hay localidadId, retornando array vacío');
        return [];
      }
      
      try {
        const { data, error, status } = await supabase
          .from('barrio')
          .select('*')
          .eq('id_localidad', localidadId)
          .order('nombre', { ascending: true });

        if (error) {
          console.error('❌ Error cargando barrios:', error);
          throw error;
        }

        console.log('✅ Barrios cargados:', data?.length);
        return data as Barrio[] || [];
      } catch (error) {
        console.error('💥 Error fatal cargando barrios:', error);
        return [];
      }
    },
    enabled: !!localidadId,
    staleTime: 1000 * 60 * 60,
  });
};