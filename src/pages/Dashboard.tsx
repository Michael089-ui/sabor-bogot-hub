import { useState } from "react";
import { Search, Map, MessageSquare, Heart, Star, Sparkles, Loader2, ChevronRight, Utensils, Coffee, Fish, Pizza, Leaf, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RestauranteCard } from "@/components/RestauranteCard";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";
import { useNavigate } from "react-router-dom";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/contexts/ChatContext";

const categorias = [
  { id: "colombiana", nombre: "Comida Típica", icon: Utensils, color: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400", filter: "Colombian" },
  { id: "brunch", nombre: "Brunch", icon: Coffee, color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400", filter: "Brunch" },
  { id: "sushi", nombre: "Sushi & Asian", icon: Fish, color: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400", filter: "Japanese" },
  { id: "italiana", nombre: "Pizza & Italian", icon: Pizza, color: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400", filter: "Italian" },
  { id: "veggie", nombre: "Veggie & Vegan", icon: Leaf, color: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400", filter: "Vegetarian" },
  { id: "grupos", nombre: "Para Grupos", icon: Users, color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400", filter: "International" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { openChat } = useChat();
  
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { data: restaurants, isLoading: loadingRestaurants } = useRestaurants(5);

  const restaurantesRecomendados = restaurants || [];
  const featuredRestaurant = restaurantesRecomendados[0];

  // Datos del usuario para personalización
  const userName = profile?.nombre || "";
  const tipoComida = profile?.tipo_comida || [];
  const presupuesto = profile?.presupuesto || null;
  const neighborhood = profile?.ubicacion || null;
  const hasPreferences = tipoComida.length > 0 || presupuesto || neighborhood;

  const accesosRapidos = [
    {
      titulo: "Explorar Mapa",
      descripcion: "Encuentra restaurantes cerca de ti",
      icon: Map,
      ruta: "/mapa",
      color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
    },
    {
      titulo: "Chat IA",
      descripcion: "Pregunta por recomendaciones personalizadas",
      icon: MessageSquare,
      ruta: "/chat-ia",
      color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
    },
    {
      titulo: "Mis Favoritos",
      descripcion: "Revisa tus lugares guardados",
      icon: Heart,
      ruta: "/favoritos",
      color: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
    },
    {
      titulo: "Mis Reseñas",
      descripcion: "Gestiona tus opiniones",
      icon: Star,
      ruta: "/resenas",
      color: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400"
    }
  ];

  const handleBuscarConIA = () => {
    if (searchQuery.trim()) {
      openChat(searchQuery.trim());
    } else {
      openChat();
    }
  };

  const handleIADecide = () => {
    openChat("Sorpréndeme con una recomendación basada en mis gustos");
  };

  const handleCategoryClick = (filter: string) => {
    navigate(`/restaurantes?cuisine=${filter}`);
  };

  return (
    <div className="min-h-full">
      {/* Hero Section - Split Layout */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            {/* Left Column - Text & Search */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  {userName ? `¡Hola, ${userName}!` : "Descubre tu próximo restaurante favorito"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Explora los mejores restaurantes de Bogotá con ayuda de inteligencia artificial
                </p>
              </div>

              {/* Search */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="¿Qué tipo de comida estás buscando?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscarConIA()}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <Button 
                  size="lg" 
                  onClick={handleBuscarConIA}
                  className="gap-2 px-6"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Buscar</span>
                </Button>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleIADecide}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Dejar que la IA decida por mí
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/restaurantes")}
                  className="gap-1"
                >
                  Ver todos los restaurantes
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Column - Featured Restaurant */}
            <div className="lg:col-span-2 hidden lg:block">
              {loadingRestaurants ? (
                <div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
              ) : featuredRestaurant ? (
                <div 
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/restaurantes/${featuredRestaurant.place_id}`)}
                >
                  <img
                    src={featuredRestaurant.photos?.[0] || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600`}
                    alt={featuredRestaurant.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-sm font-medium opacity-90 mb-1">
                      ✨ Te encontré algo en {featuredRestaurant.neighborhood || "Bogotá"}
                    </p>
                    <h3 className="text-xl font-bold">{featuredRestaurant.name}</h3>
                    <p className="text-sm opacity-80 mt-1">
                      {featuredRestaurant.cuisine} • {featuredRestaurant.rating ? `⭐ ${featuredRestaurant.rating}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                  Sin restaurante destacado
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground">Explora por Categorías</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.filter)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl ${cat.color} hover:opacity-80 transition-opacity whitespace-nowrap border border-transparent hover:border-border`}
            >
              <cat.icon className="h-5 w-5" />
              <span className="font-medium">{cat.nombre}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Sección de Recomendaciones */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        {hasPreferences ? (
          <PersonalizedRecommendations
            tipoComida={tipoComida}
            presupuesto={presupuesto}
            neighborhood={neighborhood}
          />
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground mb-1">
                Recomendados para ti
              </h2>
              <p className="text-sm text-muted-foreground">
                Descubre lugares que podrían interesarte
              </p>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {loadingRestaurants ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Cargando restaurantes...</span>
                </div>
              ) : restaurantesRecomendados.length > 0 ? (
                restaurantesRecomendados.map((restaurante) => (
                  <RestauranteCard
                    key={restaurante.id}
                    restaurant={restaurante}
                    onClick={() => navigate(`/restaurantes/${restaurante.place_id}`)}
                  />
                ))
              ) : (
                <p className="text-muted-foreground">No hay restaurantes disponibles</p>
              )}
            </div>
          </>
        )}
      </section>

      {/* Accesos Rápidos */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground mb-1">
            Accesos Rápidos
          </h2>
          <p className="text-sm text-muted-foreground">
            Explora las funcionalidades principales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accesosRapidos.map((acceso) => (
            <Card 
              key={acceso.titulo}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(acceso.ruta)}
            >
              <CardHeader className="pb-3">
                <div className={`w-10 h-10 rounded-lg ${acceso.color} flex items-center justify-center mb-2`}>
                  <acceso.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{acceso.titulo}</CardTitle>
                <CardDescription className="text-sm">{acceso.descripcion}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
