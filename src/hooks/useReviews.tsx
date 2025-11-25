import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Review {
  id_resena: string;
  id_usuario: string;
  place_id: string;
  calificacion: number | null;
  comentario: string | null;
  fecha_resena: string | null;
}

export interface CreateReviewInput {
  place_id: string;
  calificacion: number;
  comentario: string;
}

export interface UpdateReviewInput {
  id_resena: string;
  calificacion: number;
  comentario: string;
}

// Hook para obtener reseñas del usuario
export const useUserReviews = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("resena")
        .select("*")
        .eq("id_usuario", user.id)
        .order("fecha_resena", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!user?.id,
  });
};

// Hook para obtener reseñas de un restaurante específico
export const useRestaurantReviews = (placeId: string | undefined) => {
  return useQuery({
    queryKey: ["restaurant-reviews", placeId],
    queryFn: async () => {
      if (!placeId) throw new Error("Place ID es requerido");

      const { data, error } = await supabase
        .from("resena")
        .select("*")
        .eq("place_id", placeId)
        .order("fecha_resena", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!placeId,
  });
};

// Hook para crear una reseña
export const useCreateReview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("resena")
        .insert({
          id_usuario: user.id,
          place_id: input.place_id,
          calificacion: input.calificacion,
          comentario: input.comentario,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-reviews", variables.place_id] });
      toast.success("Reseña publicada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al publicar la reseña: " + error.message);
    },
  });
};

// Hook para actualizar una reseña
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateReviewInput) => {
      const { data, error } = await supabase
        .from("resena")
        .update({
          calificacion: input.calificacion,
          comentario: input.comentario,
        })
        .eq("id_resena", input.id_resena)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-reviews"] });
      toast.success("Reseña actualizada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar la reseña: " + error.message);
    },
  });
};

// Hook para eliminar una reseña
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from("resena")
        .delete()
        .eq("id_resena", reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-reviews"] });
      toast.success("Reseña eliminada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar la reseña: " + error.message);
    },
  });
};
