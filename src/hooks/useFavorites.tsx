import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Favorite {
  id_favorito: string;
  id_usuario: string;
  place_id: string;
  fecha_agregado: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos del usuario
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("favorito")
          .select("place_id")
          .eq("id_usuario", user.id);

        if (error) throw error;

        const favoriteIds = data?.map((f) => f.place_id) || [];
        setFavorites(favoriteIds);
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  const isFavorite = (placeId: string) => {
    return favorites.includes(placeId);
  };

  const toggleFavorite = async (placeId: string) => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar favoritos");
      return;
    }

    try {
      if (isFavorite(placeId)) {
        // Eliminar de favoritos
        const { error } = await supabase
          .from("favorito")
          .delete()
          .eq("id_usuario", user.id)
          .eq("place_id", placeId);

        if (error) throw error;

        setFavorites(favorites.filter((id) => id !== placeId));
        toast.success("Eliminado de favoritos");
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from("favorito")
          .insert({
            id_usuario: user.id,
            place_id: placeId,
          });

        if (error) throw error;

        setFavorites([...favorites, placeId]);
        toast.success("Agregado a favoritos");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Error al actualizar favoritos");
    }
  };

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
  };
};
