import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  Sparkles, 
  Loader2, 
  Expand,
  X,
  MapPin,
  Star,
  Heart,
  Users,
  Coffee,
  Briefcase,
  Building,
  Leaf,
  DollarSign,
  Utensils
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@/contexts/ChatContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { getPhotoUrl } from "@/hooks/useRestaurants";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Restaurant {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  price_level?: string;
  cuisine?: string;
  photos?: any[];
  location?: { lat: number; lng: number };
  ai_reason?: string;
}

const quickSuggestions = [
  { icon: Heart, label: "Romántico", prompt: "Recomiéndame restaurantes románticos para una cita especial" },
  { icon: DollarSign, label: "Económico", prompt: "Busco opciones económicas pero deliciosas" },
  { icon: Leaf, label: "Vegetariano", prompt: "Restaurantes con buenas opciones vegetarianas" },
  { icon: Utensils, label: "Colombiana", prompt: "Quiero probar la mejor comida colombiana tradicional" },
  { icon: Coffee, label: "Desayuno", prompt: "Los mejores sitios para un desayuno bogotano" },
  { icon: Building, label: "Rooftops", prompt: "Restaurantes con terraza o rooftop con buena vista" },
  { icon: Users, label: "Familiar", prompt: "Restaurantes ideales para ir con la familia" },
  { icon: Briefcase, label: "Negocios", prompt: "Sitios elegantes para reuniones de negocios" },
];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "12px",
};

const defaultCenter = {
  lat: 4.6687,
  lng: -74.0547,
};

export function ChatSheet() {
  const navigate = useNavigate();
  const { 
    isOpen, 
    closeChat, 
    messages, 
    setMessages, 
    initialPrompt, 
    clearInitialPrompt,
    isLoading,
    setIsLoading 
  } = useChat();
  const [inputMessage, setInputMessage] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitialPrompt = useRef(false);
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle initial prompt
  useEffect(() => {
    if (isOpen && initialPrompt && !hasProcessedInitialPrompt.current) {
      hasProcessedInitialPrompt.current = true;
      handleSend(initialPrompt);
      clearInitialPrompt();
    }
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    if (!isOpen) {
      hasProcessedInitialPrompt.current = false;
    }
  }, [isOpen]);

  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, { ...userMessage, id: Date.now().toString(), timestamp: new Date() }]);
    setInputMessage("");
    setIsLoading(true);
    setRestaurants([]);

    try {
      let preferencesContext = '';
      if (userProfile?.tipo_comida?.length > 0 || userProfile?.presupuesto || userProfile?.ubicacion) {
        preferencesContext = `\n\n**PREFERENCIAS DEL USUARIO:**
${userProfile.tipo_comida?.length > 0 ? `- Tipos de comida favoritos: ${userProfile.tipo_comida.join(', ')}` : ''}
${userProfile.presupuesto ? `- Presupuesto preferido: ${userProfile.presupuesto}` : ''}
${userProfile.ubicacion ? `- Ubicación preferida: ${userProfile.ubicacion}` : ''}`;
      }

      const systemPrompt = `Eres Sabor Capital, un asistente experto en restaurantes de Bogotá, Colombia. 
Tu misión es ayudar a los usuarios a encontrar el lugar perfecto para comer.

**INSTRUCCIONES:**
- Responde de forma amigable y concisa (máximo 3-4 párrafos)
- Da 2-3 recomendaciones específicas con nombre, tipo de comida, y zona
- Si el usuario quiere más detalles, sugiere abrir la página de Chat IA completo
${preferencesContext}`;

      const allMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      allMessages.push({ role: "user", content: messageToSend });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt,
            userPreferences: userProfile ? {
              tipo_comida: userProfile.tipo_comida,
              presupuesto: userProfile.presupuesto,
              ubicacion: userProfile.ubicacion
            } : undefined,
            messages: allMessages
          })
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Error al conectar con el asistente');
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              // Skip metadata in sheet view
              if (parsed.type === 'metadata') continue;

              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullContent += text;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.role === "assistant") {
                    return [...newMessages.slice(0, -1), { ...lastMessage, content: lastMessage.content + text }];
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parseando SSE:', e);
            }
          }
        }
      }

      // Try to fetch restaurants from cache based on conversation
      const { data: cachedData } = await supabase
        .from("restaurant_cache")
        .select("*")
        .limit(6);
      
      if (cachedData && cachedData.length > 0) {
        const enrichedRestaurants = cachedData.map((r) => ({
          place_id: r.place_id,
          name: r.name,
          formatted_address: r.formatted_address,
          rating: r.rating,
          price_level: r.price_level,
          cuisine: r.cuisine,
          photos: r.photos as any[],
          location: r.location as { lat: number; lng: number },
          ai_reason: "Recomendado según tus preferencias y la conversación",
        }));
        setRestaurants(enrichedRestaurants);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFullChat = () => {
    closeChat();
    navigate("/chat-ia");
  };

  const getRestaurantImage = (restaurant: Restaurant) => {
    if (restaurant.photos && restaurant.photos.length > 0) {
      const photoRef = restaurant.photos[0]?.photo_reference || restaurant.photos[0];
      if (photoRef) {
        return getPhotoUrl(photoRef, 400);
      }
    }
    return `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop`;
  };

  const formatPrice = (priceLevel: string | undefined) => {
    if (!priceLevel) return "$";
    const level = parseInt(priceLevel) || 1;
    return "$".repeat(Math.min(level, 4));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] p-0 rounded-t-3xl border-t-2 border-primary/20 bg-background"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <SheetHeader className="text-left space-y-0">
              <SheetTitle className="text-lg font-semibold">Sabor Capital IA</SheetTitle>
              <p className="text-xs text-muted-foreground">Tu asistente gastronómico personal</p>
            </SheetHeader>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleOpenFullChat} title="Pantalla completa">
              <Expand className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={closeChat}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="relative max-w-2xl mx-auto">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="¿Qué te apetece comer hoy?"
              className="pl-12 pr-12 h-12 rounded-full border-2 border-primary/20 focus:border-primary bg-background text-base"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={isLoading || !inputMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-8 h-8"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-4xl mx-auto">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSend(suggestion.prompt)}
                disabled={isLoading}
                className="rounded-full text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <suggestion.icon className="w-3.5 h-3.5" />
                {suggestion.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content: Map + Restaurant List */}
        <div className="flex-1 flex h-[calc(85vh-200px)]">
          {/* Map Section - 65% */}
          <div className="w-[65%] p-4 border-r">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  restaurants.length > 0 && restaurants[0].location
                    ? restaurants[0].location
                    : defaultCenter
                }
                zoom={13}
                options={{
                  styles: [
                    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
                  ],
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                }}
              >
                {restaurants.map((restaurant, index) => {
                  if (!restaurant.location) return null;
                  return (
                    <Marker
                      key={restaurant.place_id}
                      position={restaurant.location}
                      onClick={() => setSelectedRestaurant(restaurant)}
                      label={{
                        text: String(index + 1),
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  );
                })}

                {selectedRestaurant && selectedRestaurant.location && (
                  <InfoWindow
                    position={selectedRestaurant.location}
                    onCloseClick={() => setSelectedRestaurant(null)}
                  >
                    <div className="p-2 max-w-[200px]">
                      <h3 className="font-semibold text-sm">{selectedRestaurant.name}</h3>
                      {selectedRestaurant.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{selectedRestaurant.rating}</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="mt-2 w-full text-xs h-7"
                        onClick={() => {
                          window.open(`/restaurante/${selectedRestaurant.place_id}`, '_blank');
                        }}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="w-full h-full bg-muted/50 rounded-xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Restaurant List Section - 35% */}
          <div className="w-[35%] flex flex-col">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Recomendaciones de la IA
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {restaurants.length > 0 
                  ? `${restaurants.length} restaurantes encontrados`
                  : "Haz una pregunta para ver recomendaciones"
                }
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {isLoading && restaurants.length === 0 && (
                  <>
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="flex">
                          <Skeleton className="w-24 h-24" />
                          <div className="flex-1 p-3 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}

                {restaurants.length === 0 && !isLoading && messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Pregúntame qué quieres comer</p>
                    <p className="text-xs mt-1">y te mostraré los mejores lugares</p>
                  </div>
                )}

                {restaurants.map((restaurant, index) => (
                  <Card 
                    key={restaurant.place_id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
                    onClick={() => setSelectedRestaurant(restaurant)}
                  >
                    <div className="flex">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={getRestaurantImage(restaurant)}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 
                              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop";
                          }}
                        />
                      </div>
                      <CardContent className="flex-1 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm line-clamp-1">{restaurant.name}</h4>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {index + 1}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {restaurant.rating && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{restaurant.rating}</span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(restaurant.price_level)}
                          </span>
                          {restaurant.cuisine && (
                            <Badge variant="outline" className="text-[10px]">
                              {restaurant.cuisine}
                            </Badge>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 italic">
                          <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                          {restaurant.ai_reason}
                        </p>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
