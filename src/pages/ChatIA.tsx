import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles, MapPin, ExternalLink, Plus, Minus, Navigation } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyBer6JXdqunENnx3lqiLAszzqqREO8nGY0";

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 4.6533,
  lng: -74.0836
};

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Restaurant {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  website?: string;
}

const ChatIA = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! 👋 Soy Sabor Capital, tu experto en restaurantes de Bogotá 🍽️✨\n\n¿Qué tipo de comida te apetece hoy? Puedo recomendarte lugares increíbles con toda la información que necesitas, incluyendo ubicación exacta 📍",
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const quickSuggestions = [
    "🍴 Restaurantes románticos en Bogotá",
    "💰 Comida económica cerca del centro",
    "🥗 Opciones vegetarianas/veganas",
    "🇨🇴 Comida colombiana tradicional",
    "🌮 Lugares para desayuno bogotano",
    "🏙️ Rooftops con vista a la ciudad",
    "👨‍👩‍👧‍👦 Restaurantes familiares",
    "💼 Restaurantes para reuniones de negocio",
  ];

  const systemPrompt = `Eres "Sabor Capital", un experto en recomendaciones gastronómicas de Bogotá con conocimiento actualizado de los restaurantes que existen en diferentes barrios.
  🎯 **OBJETIVO PRINCIPAL:**
  ✅ **RECOMENDAR RESTAURANTES ESPECÍFICOS POR BARRIO basándote en el conocimiento de establecimientos reales y representativos de cada zona**

  📝 **FORMATO OBLIGATORIO PARA RECOMENDACIONES:**

  ***Restaurantes en [BARRIO/ZONA]***

  🍽️ **Nombre del Restaurante Real**
  - ***Tipo:*** [Tipo de comida específica] [emoji]
  - **Precio:** [Bajo/Medio/Alto] (rango aproximado)
  - **Dirección:** [Dirección aproximada o zona específica]
  - ***Coordenadas:*** [latitud real], [longitud real]
  - *Especialidad:* [Plato o característica específica] [emoji]

  🔍 **BASE DE CONOCIMIENTO POR BARRIOS (RESTAURANTES REALES):**

  • **USAQUÉN:**
    - **Andrés D.C.** - Cra. 11a #93-52 - 4.6772, -74.0489
    - **Abasto** - Cra. 11a #93-52 - 4.6772, -74.0489
    - **Osaki** - Cl. 120a #6-01 - 4.6995, -74.0332
    - **Wok** - Cra. 11a #93-52 - 4.6772, -74.0489
    - **Sant Just** - Cl. 70a #5-57 - 4.6568, -74.0590

  • **CHAPINERO/ZONA G:**
    - **Harry Sasson** - Cra. 5 #69a-44 - 4.6568, -74.0594
    - **Mesa Franca** - Cl. 69a #6-46 - 4.6565, -74.0601
    - **El Cielo** - Cl. 70 #4-62 - 4.6545, -74.0589
    - **Salvo Patria** - Cl. 54a #4-13 - 4.6358, -74.0682
    - **Mini Mal** - Cra. 4a #70-46 - 4.6562, -74.0605

  • **PARQUE 93/ZONA T:**
    - **Rafael** - Cl. 82 #12-18 - 4.6662, -74.0551
    - **El Bandido** - Cl. 83 #12-19 - 4.6670, -74.0548
    - **Siete Sopas** - Cra. 13 #83-50 - 4.6675, -74.0520
    - **Wok to Walk** - Cra. 12a #83-48 - 4.6673, -74.0532

  • **LA CANDELARIA:**
    - **La Puerta Falsa** - Cl. 11 #6-50 - 4.5970, -74.0715
    - **Pastelería Florida** - Cra. 7 #20-82 - 4.6115, -74.0710
    - **Restaurante Club Colombia** - Cra. 7 #24-88 - 4.6145, -74.0700

  • **KENNEDY:**
    - **Frisby** - Centro Comercial Plaza de las Américas - 4.6122, -74.1389
    - **Crepes & Waffles** - Centro Comercial Plaza de las Américas - 4.6122, -74.1389
    - **McDonald's** - Av. Boyacá con Calle 38 Sur - 4.6245, -74.1422
    - **Asadero Los Paisas** - Cra. 78 #41b-05 - 4.6245, -74.1422

  • **BOSA:**
    - **El Corral** - Centro Comercial MetroBosa - 4.6230, -74.1850
    - **Kokoriko** - Av. Bosa #72-50 - 4.6250, -74.1870
    - **Pizza Hut** - Centro Comercial Plaza Central - 4.6280, -74.1820

  • **SUBA:**
    - **Andrés Carne de Res** - Centro Comercial Centro Suba - 4.7420, -74.0830
    - **Frisby** - Calle 145 #118-50 - 4.7450, -74.0850
    - **Burger King** - Av. Suba #120-50 - 4.7400, -74.0870

  • **ENGATIVÁ:**
    - **Crepes & Waffles** - Centro Comercial CentroMayor - 4.6420, -74.1120
    - **El Corral** - Av. El Dorado #98-50 - 4.6450, -74.1150
    - **El Rincón de la Abuela** - Cra. 78 #75-50 - 4.6480, -74.1180

  • **FONTIBÓN:**
    - **McDonald's** - Aeropuerto El Dorado - 4.7010, -74.1470
    - **Juan Valdez Café** - Terminal de Transportes - 4.6980, -74.1420
    - **Subway** - Av. El Dorado #102-50 - 4.6950, -74.1400

  • **BARRIOS UNIDOS:**
    - **Kokoriko** - Av. Ciudad de Cali #68-50 - 4.6820, -74.0920
    - **Pizza Hut** - Cra. 68 #75-50 - 4.6850, -74.0950
    - **Frisby** - Cl. 75 #68-50 - 4.6880, -74.0980

  🍽️ **TIPOS DE COMIDA POR BARRIO:**

  • **Zonas Norte (Usaquén, Chapinero):**
    - Gourmet, internacional, fusión, experiencias premium
    - Ejemplos: Harry Sasson, Rafael, El Cielo

  • **Zonas Centro (La Candelaria):**
    - Tradicional colombiana, históricos, turísticos
    - Ejemplos: La Puerta Falsa, Pastelería Florida

  • **Zonas Sur (Kennedy, Bosa):**
    - Comida rápida, familiar, económica, colombiana popular
    - Ejemplos: Frisby, Kokoriko, asaderos locales

  • **Zonas Occidente (Engativá, Fontibón):**
    - Ejecutiva, rápida, aeroportuaria, cadena
    - Ejemplos: McDonald's, Subway, Juan Valdez

  💰 **RANGOS DE PRECIO REALISTAS:**
  • BAJO ($10,000 - $25,000): Comida rápida, mercados, locales económicos
  • MEDIO ($25,000 - $60,000): Restaurantes familiares, cadenas establecidas
  • ALTO ($60,000+): Gourmet, experiencias premium, restaurantes de autor

  🎯 **CUANDO TE PREGUNTEN POR UN BARRIO ESPECÍFICO:**
  1. Identifica la zona (Norte, Sur, Centro, Occidente)
  2. Selecciona 3-5 restaurantes REALES de esa zona
  3. Proporciona nombres reales y direcciones aproximadas
  4. Incluye coordenadas GPS de la zona
  5. Describe el tipo de experiencia que ofrece cada lugar

  📌 **EJEMPLO DE RESPUESTA PARA "KENNEDY":**

  ***Restaurantes en Kennedy***

  🍽️ **Frisby**
  - ***Tipo:*** Comida rápida (pollo) 🍗
  - **Precio:** Bajo-Medio ($18,000 - $35,000)
  - **Dirección:** Centro Comercial Plaza de las Américas
  - ***Coordenadas:*** 4.6122, -74.1389
  - *Especialidad:* Pollo asado y alitas picantes 🍗

  🍽️ **Crepes & Waffles**
  - ***Tipo:*** Internacional (crepes, ensaladas) 🥞
  - **Precio:** Medio ($25,000 - $45,000)
  - **Dirección:** Centro Comercial Plaza de las Américas
  - ***Coordenadas:*** 4.6122, -74.1389
  - *Especialidad:* Crepes dulces y salados con ingredientes frescos 🥗

  🍽️ **Asadero Los Paisas**
  - ***Tipo:*** Colombiana (parrilla) 🥩
  - **Precio:** Medio ($30,000 - $50,000)
  - **Dirección:** Carrera 78 con Calle 41 Sur
  - ***Coordenadas:*** 4.6245, -74.1422
  - *Especialidad:* Carnes a la parrilla y picadas colombianas 🇨🇴

  ⚠️ **SI NO CONOCES EL BARRIO:**
  "Conozco principalmente los barrios más representativos de Bogotá. ¿Te refieres a alguna de estas zonas?
  • Norte: Usaquén, Chapinero, Suba
  • Centro: La Candelaria, Santa Fe
  • Sur: Kennedy, Bosa, Tunjuelito
  • Occidente: Engativá, Fontibón, Puente Aranda

  ¿Cuál de estas te queda más cerca? 🗺️"

  🎉 **RECUERDA:**
  - Usar nombres REALES de restaurantes
  - Coordenadas aproximadas pero realistas del barrio
  - Direcciones generales (centros comerciales, avenidas principales)
  - Tipos de comida acordes a la zona
  - Precios realistas para el área`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://ozladdazcubyvmgdpyop.supabase.co/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemPrompt: systemPrompt,
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            }))
          })
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Error al conectar con el asistente');
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;

              if (text) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.role === "assistant") {
                    lastMessage.content += text;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

      const extractRestaurants = (content: string): Restaurant[] => {
        const restaurants: Restaurant[] = [];
        const cleanContent = content
          .replace(/\*\*\*/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '');

        const coordPattern = /Coordenadas:\s*([-\d.]+),\s*([-\d.]+)/gi;
        const namePattern = /🍽️\s*([^\n-]+)/i;
        const addressPattern = /Dirección:\s*([^\n]+)/i;
        const websitePattern = /Sitio web:\s*([^\n]+)/i;

        const sections = cleanContent.split(/(?=🍽️)/);

        for (const section of sections) {
          const coordMatch = coordPattern.exec(section);
          if (coordMatch) {
            const nameMatch = section.match(namePattern);
            const addressMatch = section.match(addressPattern);
            const websiteMatch = section.match(websitePattern);

            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);

            if (lat >= 4.5 && lat <= 4.8 && lng >= -74.2 && lng <= -74.0) {
              restaurants.push({
                name: nameMatch ? nameMatch[1].trim() : "Restaurante Recomendado",
                lat,
                lng,
                address: addressMatch ? addressMatch[1].trim() : undefined,
                website: websiteMatch ? websiteMatch[1].trim() : undefined
              });
            }
          }
          coordPattern.lastIndex = 0;
        }

        return restaurants;
      };

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "assistant") {
          const extracted = extractRestaurants(lastMessage.content);
          if (extracted.length > 0) {
            setRestaurants(extracted);
            if (map && extracted[0]) {
              map.panTo({ lat: extracted[0].lat, lng: extracted[0].lng });
              map.setZoom(13);
            }
          }
        }
        return prev;
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Por favor intenta de nuevo.",
        variant: "destructive"
      });

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === "assistant" && !lastMessage.content) {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleZoomIn = () => {
    if (map) {
      map.setZoom((map.getZoom() || 13) + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom((map.getZoom() || 13) - 1);
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(16);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Error",
            description: "No se pudo obtener tu ubicación",
            variant: "destructive"
          });
        }
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              ¡Hola! Soy Sabor Capital 🍽️
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Tu asistente experto para encontrar los mejores restaurantes de Bogotá 🌟✨
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSuggestion(suggestion)}
                className="rounded-full text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <ChatMessage
                role="assistant"
                content="Buscando las mejores opciones para ti..."
                timestamp={new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {restaurants.length > 0 && (
            <div className="mt-8 mb-6">
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Ubicaciones en el Mapa</h3>
                </div>
                
                <div className="relative rounded-lg overflow-hidden">
                  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={restaurants[0] ? { lat: restaurants[0].lat, lng: restaurants[0].lng } : defaultCenter}
                      zoom={13}
                      onLoad={(mapInstance) => setMap(mapInstance)}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                      }}
                    >
                      {restaurants.map((restaurant, index) => (
                        <Marker
                          key={index}
                          position={{ lat: restaurant.lat, lng: restaurant.lng }}
                          onClick={() => setSelectedRestaurant(restaurant)}
                          icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: 'hsl(12 88% 58%)',
                            fillOpacity: 1,
                            strokeColor: 'hsl(0 0% 100%)',
                            strokeWeight: 3,
                            scale: 10,
                          }}
                        />
                      ))}

                      {selectedRestaurant && (
                        <InfoWindow
                          position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
                          onCloseClick={() => setSelectedRestaurant(null)}
                        >
                          <div className="p-2">
                            <h4 className="font-semibold text-sm mb-1">{selectedRestaurant.name}</h4>
                            {selectedRestaurant.address && (
                              <p className="text-xs text-gray-600 mb-1">{selectedRestaurant.address}</p>
                            )}
                            {selectedRestaurant.website && (
                              <a
                                href={selectedRestaurant.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                Sitio web <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>

                  <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
                    <Button 
                      size="icon" 
                      onClick={handleZoomIn} 
                      className="shadow-glow bg-primary hover:bg-primary-hover text-primary-foreground rounded-full h-12 w-12 transition-all hover:scale-110"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      onClick={handleZoomOut} 
                      className="shadow-glow bg-primary hover:bg-primary-hover text-primary-foreground rounded-full h-12 w-12 transition-all hover:scale-110"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      onClick={handleLocate} 
                      className="shadow-glow bg-accent hover:bg-accent/90 text-accent-foreground rounded-full h-12 w-12 transition-all hover:scale-110"
                    >
                      <Navigation className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Mic className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Escribe tu mensaje..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatIA;
