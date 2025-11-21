// Type definitions for Sabor Capital

// Database types - to be used when implementing Supabase integration

export interface Usuario {
  id: string; // UUID from Supabase Auth
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  tipo_comida?: string[];
  presupuesto?: string;
  ubicacion?: string;
  foto_url?: string;
  fecha_registro: string;
}

export interface Establecimiento {
  id_establecimiento: number;
  google_place_id: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  id_categoria?: number;
}

export interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
}

export interface Categorizacion {
  id_categorizacion: number;
  id_establecimiento: number;
  id_categoria: number;
  fecha_asignacion: string;
}

export interface Resena {
  id_resena: number;
  id_usuario: string;
  id_establecimiento: number;
  calificacion: number;
  comentario: string;
  fecha_creacion: string;
}

export interface Favorito {
  id_favorito: number;
  id_usuario: string;
  id_establecimiento: number;
  fecha_favorito: string;
}

export interface Busqueda {
  id_busqueda: number;
  id_usuario: string;
  consulta_texto: string;
  fecha_consulta: string;
}

export interface ResultadoBusqueda {
  id_resultado: number;
  id_busqueda: number;
  id_establecimiento: number;
  posicion_ranking: number;
  fecha_hora: string;
}

export interface LogAuditoria {
  id_log: number;
  id_usuario: string;
  accion: string;
  fecha_hora: string;
}

// Google Places API types
export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  types?: string[];
}
