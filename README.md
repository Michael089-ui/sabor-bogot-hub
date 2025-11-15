# Sabor Capital

Plataforma web gastronómica para la ciudad de Bogotá. Usa Google Places API para obtener información de restaurantes e incorpora un asistente de IA para recomendar lugares según preferencias del usuario usando lenguaje natural.

## Características principales

- 🤖 **Chat IA**: Búsqueda conversacional de restaurantes usando IA
- 🗺️ **Mapa interactivo**: Visualización de restaurantes con pines
- 🍽️ **Información detallada**: Datos de Google Places (fotos, ratings, horarios)
- ⭐ **Reseñas locales**: Sistema de reseñas de la comunidad
- ❤️ **Favoritos**: Guarda tus restaurantes preferidos
- 📜 **Historial**: Consulta búsquedas anteriores
- 👤 **Gestión de cuenta**: Perfil y configuración

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/          # Componentes de layout (Sidebar, MainLayout)
│   └── ui/              # Componentes UI de shadcn
├── pages/               # Páginas de la aplicación
├── lib/
│   ├── types.ts         # Definiciones de tipos TypeScript
│   └── utils.ts         # Utilidades
├── hooks/               # Custom hooks
└── index.css           # Estilos globales y tokens de diseño

```

## Stack tecnológico

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Routing**: React Router
- **Backend** (por configurar): Lovable Cloud (Supabase)
- **APIs** (por configurar):
  - Google Places API
  - Gemini IA

## Configuración del desarrollo

```sh
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Estado actual del proyecto

✅ Arquitectura base configurada  
✅ Sistema de diseño (colores gastronómicos)  
✅ Navegación con sidebar  
✅ Rutas y páginas placeholder  
✅ Componentes base reutilizables  

⏳ Pendiente: Implementación de UI basada en wireframes de Stitch  
⏳ Pendiente: Integración con Lovable Cloud  
⏳ Pendiente: Integración con Google Places API  
⏳ Pendiente: Integración con IA para recomendaciones  

## Notas de diseño

El diseño usa una paleta de colores cálidos inspirada en la gastronomía colombiana:
- **Primary**: Terracota/naranja (#e67444) - calidez colombiana
- **Accent**: Verde (#4aba81) - paisajes colombianos
- **Secundarios**: Tonos tierra y crema

Las pantallas actuales son placeholders que serán reemplazados por diseños finales basados en wireframes.
