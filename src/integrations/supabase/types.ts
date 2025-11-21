export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      favorito: {
        Row: {
          fecha_agregado: string | null
          id_favorito: string
          id_usuario: string
          place_id: string
        }
        Insert: {
          fecha_agregado?: string | null
          id_favorito?: string
          id_usuario: string
          place_id: string
        }
        Update: {
          fecha_agregado?: string | null
          id_favorito?: string
          id_usuario?: string
          place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorito_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_busqueda: {
        Row: {
          fecha: string | null
          id_busqueda: string
          id_usuario: string
          query: string
        }
        Insert: {
          fecha?: string | null
          id_busqueda?: string
          id_usuario: string
          query: string
        }
        Update: {
          fecha?: string | null
          id_busqueda?: string
          id_usuario?: string
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_busqueda_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      log_accion: {
        Row: {
          accion: string
          fecha: string | null
          id_log: string
          id_usuario: string
        }
        Insert: {
          accion: string
          fecha?: string | null
          id_log?: string
          id_usuario: string
        }
        Update: {
          accion?: string
          fecha?: string | null
          id_log?: string
          id_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_accion_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      resena: {
        Row: {
          calificacion: number | null
          comentario: string | null
          fecha_resena: string | null
          id_resena: string
          id_usuario: string
          place_id: string
        }
        Insert: {
          calificacion?: number | null
          comentario?: string | null
          fecha_resena?: string | null
          id_resena?: string
          id_usuario: string
          place_id: string
        }
        Update: {
          calificacion?: number | null
          comentario?: string | null
          fecha_resena?: string | null
          id_resena?: string
          id_usuario?: string
          place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resena_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_cache: {
        Row: {
          cached_at: string | null
          expires_at: string | null
          formatted_address: string | null
          id: string
          location: Json
          name: string
          neighborhood: string | null
          open_now: boolean | null
          opening_hours: Json | null
          phone_number: string | null
          photos: Json | null
          place_id: string
          price_level: string | null
          rating: number | null
          search_query: string | null
          types: string[] | null
          user_ratings_total: number | null
          website: string | null
        }
        Insert: {
          cached_at?: string | null
          expires_at?: string | null
          formatted_address?: string | null
          id?: string
          location: Json
          name: string
          neighborhood?: string | null
          open_now?: boolean | null
          opening_hours?: Json | null
          phone_number?: string | null
          photos?: Json | null
          place_id: string
          price_level?: string | null
          rating?: number | null
          search_query?: string | null
          types?: string[] | null
          user_ratings_total?: number | null
          website?: string | null
        }
        Update: {
          cached_at?: string | null
          expires_at?: string | null
          formatted_address?: string | null
          id?: string
          location?: Json
          name?: string
          neighborhood?: string | null
          open_now?: boolean | null
          opening_hours?: Json | null
          phone_number?: string | null
          photos?: Json | null
          place_id?: string
          price_level?: string | null
          rating?: number | null
          search_query?: string | null
          types?: string[] | null
          user_ratings_total?: number | null
          website?: string | null
        }
        Relationships: []
      }
      resultado_busqueda: {
        Row: {
          direccion: string | null
          id_busqueda: string
          id_resultado: string
          nombre: string | null
          place_id: string
          rating: number | null
        }
        Insert: {
          direccion?: string | null
          id_busqueda: string
          id_resultado?: string
          nombre?: string | null
          place_id: string
          rating?: number | null
        }
        Update: {
          direccion?: string | null
          id_busqueda?: string
          id_resultado?: string
          nombre?: string | null
          place_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resultado_busqueda_id_busqueda_fkey"
            columns: ["id_busqueda"]
            isOneToOne: false
            referencedRelation: "historial_busqueda"
            referencedColumns: ["id_busqueda"]
          },
        ]
      }
      usuario: {
        Row: {
          fecha_registro: string | null
          foto_url: string | null
          id: string
          nombre: string | null
        }
        Insert: {
          fecha_registro?: string | null
          foto_url?: string | null
          id: string
          nombre?: string | null
        }
        Update: {
          fecha_registro?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
