import { useState, useEffect } from "react";
import { Search, Map, MessageSquare, Heart, Star, Sparkles, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RestauranteCard } from "@/components/RestauranteCard";
import { useNavigate } from "react-router-dom";
import { testSupabaseConnection } from "@/tests/supabaseTest";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "success" | "error">("loading");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionData, setConnectionData] = useState<any>(null);

  useEffect(() => {
    const checkConnection = async () => {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        setConnectionStatus("success");
        setConnectionMessage("Conexión a Supabase exitosa");
        setConnectionData(result.data);
      } else {
        setConnectionStatus("error");
        setConnectionMessage(result.error || "Error desconocido");
      }
    };

    checkConnection();
  }, []);

  // Mock data para recomendaciones - insertar consultas de la base - extraer info de la API de reseñas e insertarlas a la bd para consulta
  const restaurantesRecomendados = [
    {
      id: "1",
      place_id: "mock-1",
      name: "La Cocina de Sofía",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "Chapinero",
      rating: 4.8,
      user_ratings_total: 120,
      price_level: "3",
      photos: null,
      location: null,
      types: ["Comida Colombiana"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 50000,
      max_price: 100000,
      currency: "COP",
      description: null,
      cuisine: "Comida Colombiana"
    },
    {
      id: "2",
      place_id: "mock-2",
      name: "El Fogón de la Abuela",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "La Candelaria",
      rating: 4.5,
      user_ratings_total: 85,
      price_level: "2",
      photos: null,
      location: null,
      types: ["Comida Tradicional"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 25000,
      max_price: 50000,
      currency: "COP",
      description: null,
      cuisine: "Comida Tradicional"
    },
    {
      id: "3",
      place_id: "mock-3",
      name: "Sabores del Pacífico",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "Zona T",
      rating: 4.7,
      user_ratings_total: 95,
      price_level: "4",
      photos: null,
      location: null,
      types: ["Mariscos"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 100000,
      max_price: 200000,
      currency: "COP",
      description: null,
      cuisine: "Mariscos"
    },
    {
      id: "4",
      place_id: "mock-4",
      name: "El Rincón Paisa",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "Kennedy",
      rating: 4.6,
      user_ratings_total: 110,
      price_level: "2",
      photos: null,
      location: null,
      types: ["Comida Paisa"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 25000,
      max_price: 50000,
      currency: "COP",
      description: null,
      cuisine: "Comida Paisa"
    },
    {
      id: "5",
      place_id: "mock-5",
      name: "Ajiaco y Algo Más",
      formatted_address: "Bogotá, Colombia",
      neighborhood: "Usaquén",
      rating: 4.9,
      user_ratings_total: 130,
      price_level: "3",
      photos: null,
      location: null,
      types: ["Comida Bogotana"],
      open_now: true,
      opening_hours: null,
      phone_number: null,
      website: null,
      min_price: 50000,
      max_price: 100000,
      currency: "COP",
      description: null,
      cuisine: "Comida Bogotana"
    }
  ];

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
      navigate("/chat-ia", { state: { query: searchQuery } });
    } else {
      navigate("/chat-ia");
    }
  };

  return (
    <div className="min-h-full">
      {/* Prueba de Conexión Supabase */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <Card className={connectionStatus === "error" ? "border-red-500" : connectionStatus === "success" ? "border-green-500" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectionStatus === "loading" && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              {connectionStatus === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
              {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              Prueba de Conexión a Supabase
            </CardTitle>
            <CardDescription>
              Estado de la conexión con la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Estado:</strong> {connectionStatus === "loading" ? "Verificando..." : connectionStatus === "success" ? "✅ Exitosa" : "❌ Error"}
              </p>
              <p className="text-sm">
                <strong>Mensaje:</strong> {connectionMessage}
              </p>
              {connectionData && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Datos obtenidos:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(connectionData, null, 2)}
                  </pre>
                </div>
              )}
              {connectionStatus === "success" && (!connectionData || connectionData.length === 0) && (
                <p className="text-sm text-muted-foreground mt-2">
                  ℹ️ La tabla 'usuario' está vacía. Esto es normal si aún no has registrado usuarios.
                </p>
              )}
              {connectionStatus === "error" && (
                <p className="text-sm text-muted-foreground mt-2">
                  ⚠️ Verifica que las credenciales de Supabase en .env sean correctas y que la tabla 'usuario' exista.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Hero Section - Buscador Principal */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              ¡Bienvenido a Sabor Capital!
            </h1>
            <p className="text-lg text-muted-foreground">
              Descubre los mejores restaurantes de Bogotá con ayuda de IA
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
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
                Buscar con IA
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Recomendaciones */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Recomendados para ti
          </h2>
          <p className="text-muted-foreground">
            Descubre lugares que podrían interesarte
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {restaurantesRecomendados.map((restaurante) => (
            <RestauranteCard
              key={restaurante.id}
              restaurant={restaurante}
              onClick={() => navigate('/restaurantes')}
            />
          ))}
        </div>
      </section>

      {/* Accesos Rápidos */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Accesos Rápidos
          </h2>
          <p className="text-muted-foreground">
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
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${acceso.color} flex items-center justify-center mb-3`}>
                  <acceso.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{acceso.titulo}</CardTitle>
                <CardDescription>{acceso.descripcion}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
