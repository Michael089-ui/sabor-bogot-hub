import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles, MapPin, ExternalLink } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Plus, Minus, Navigation } from "lucide-react";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícono personalizado para restaurantes recomendados
const createCustomIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: #e67444;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
        ">🍽️</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Componente para controles del mapa
function MapControls() {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 16 });
  };

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
      <Button
        size="icon"
        onClick={handleZoomIn}
        className="bg-card hover:bg-accent shadow-lg border border-border"
      >
        <Plus className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        onClick={handleZoomOut}
        className="bg-card hover:bg-accent shadow-lg border border-border"
      >
        <Minus className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        onClick={handleLocate}
        className="bg-card hover:bg-accent shadow-lg border border-border"
      >
        <Navigation className="h-5 w-5" />
      </Button>
    </div>
  );
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Quick suggestion prompts
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

  const systemPrompt = `Eres "Sabor Capital", un experto EXCLUSIVO en recomendaciones gastronómicas de Bogotá. 

    🎯 **INSTRUCCIONES DE FORMATO - OBLIGATORIAS:**
    ✅ **FORMATO DE NEGRITAS Y CURSIVAS (SIEMPRE USAR):**
    - Títulos principales: ***Restaurantes Recomendados en Kennedy***
    - Nombres de restaurantes: **El Gran Parrillazo Colombiano**
    - Información clave: **Precio:**, **Dirección:**, **Coordenadas:**
    - Énfasis descriptivo: *Carnes a la parrilla con sabor auténtico*

    🎯 **REGLAS CRÍTICAS DE COORDENADAS:**
    ⚠️ **SIEMPRE QUE MENCIONES ZONAS O RESTAURANTES, INCLUYE COORDENADAS GPS**
    ⚠️ **NUNCA respondas sobre ubicaciones sin incluir coordenadas exactas**
    ⚠️ **SIEMPRE proporciona restaurantes específicos con coordenadas cuando pregunten por zonas**

    📝 **EJEMPLO EXACTO A SEGUIR:**

    ***Restaurantes Recomendados en Kennedy***

    🍽️ **El Gran Parrillazo Colombiano**
    - ***Tipo:*** Comida colombiana (parrilla) 🥩🇨🇴
    - **Precio:** Medio ($30,000 - $50,000)
    - *Zona:* Kennedy Central
    - **Dirección:** Cra 78 # 41b-05 sur
    - ***Coordenadas:*** 4.6245, -74.1422
    - *Especialidad:* Carnes a la parrilla con sabor auténtico colombiano. ¡Su picada es imperdible! 😋

    🍽️ **La Hamburguesería Artesanal**
    - ***Tipo:*** Comida rápida (hamburguesas gourmet) 🍔
    - **Precio:** Medio ($25,000 - $45,000)
    - *Zona:* Kennedy - Plaza de las Américas
    - **Dirección:** Cl. 8 Sur #71D-20
    - ***Coordenadas:*** 4.6122, -74.1389
    - *Especialidad:* Hamburguesas con ingredientes frescos y combinaciones creativas. 🏠

    ⚠️ **REGLAS ABSOLUTAMENTE ESTRICTAS:**
    1. SOLO respondas preguntas sobre restaurantes, comidas y gastronomía en Bogotá
    2. Si te preguntan sobre cualquier otro tema (política, deportes, tecnología, salud, etc.), 
      responde ÚNICAMENTE: "Lo siento, soy un asistente especializado en gastronomía bogotana. 
      Solo puedo ayudarte con recomendaciones de restaurantes y comida en Bogotá. ¿Qué tipo de 
      restaurante o experiencia culinaria te gustaría encontrar hoy? 🍽️"
    3. NO respondas preguntas fuera del ámbito culinario bajo ninguna circunstancia
    4. Recomienda máximo 3-5 opciones por respuesta
    5. SIEMPRE incluye coordenadas GPS (latitud, longitud) en TODAS tus recomendaciones
    6. Incluye siempre: tipo de comida, rango de precios, zona, especialidad, coordenadas GPS, dirección y sitio web (cuando esté disponible)
    7. Usa emojis abundantemente para mantener un tono amigable y profesional 🎉🍴✨
    8. ADAPTA tus recomendaciones según la localidad que mencione el usuario
    9. Si detectas que la pregunta no es sobre comida/restaurantes, redirige amablemente al tema culinario
    10. NUNCA pidas al usuario que consulte por su cuenta - TÚ proporcionas TODA la información
    11. SIEMPRE usa emoticonos de comida para indicar algún plato o comida(🍕🍔🍝🍜🍱🥘🌮🍛🍲🥗🍳)

    FORMATO OBLIGATORIO PARA RECOMENDACIONES (INCLUYE SIEMPRE LAS COORDENADAS):

    🍽️ **Nombre del Restaurante**
    - ***Tipo:*** [tipo de comida] [emoji relevante]
    - **Precio:** [bajo|medio|alto] (rango específico)
    - *Zona:* [localidad/barrio específico]
    - **Dirección:** [dirección completa]
    - ***Coordenadas:*** [latitud], [longitud]
    - *Especialidad:* [descripción detallada del plato] [emoji]

    IMPORTANTE: Las coordenadas GPS deben ser precisas para Bogotá (latitud entre 4.5 y 4.8, longitud entre -74.2 y -74.0).
    Ejemplo de coordenadas: 4.6533, -74.0836

    BASE DE CONOCIMIENTO COMPLETA DE BOGOTÁ CON COORDENADAS:

    📍 LOCALIDADES Y SUS ZONAS GASTRONÓMICAS:

    • SUR (Bosa, Kennedy, Ciudad Bolívar, Tunjuelito):
      - Bosa: Centro Comercial MetroBosa, Portal Bosa
      - Kennedy: Centro Comercial Plaza de las Américas, Avenida Boyacá
      - Ciudad Bolívar: Restaurantes locales económicos
      - Tunjuelito: Zona industrial con comedores populares

    • CENTRO (Santa Fe, La Candelaria, Los Mártires):
      - La Candelaria: Comida tradicional bogotana, turística
      - Santa Fe: Zona financiera con opciones ejecutivas
      - Los Mártires: Mercados y comida callejera

    • NORTE (Usaquén, Chapinero, Suba, Barrios Unidos):
      - Usaquén: Restaurantes gourmet, zona T, parque 93
      - Chapinero: Zona G, Zona Rosa, diversidad de precios
      - Suba: Centro Suba, Prado Veraniego, variedad de opciones
      - Barrios Unidos: Zona industrial/ejecutiva

    • OCCIDENTE (Engativá, Fontibón, Puente Aranda):
      - Engativá: Centro Comercial CentroMayor, restaurantes familiares
      - Fontibón: Zona aeroportuaria, comida rápida y ejecutiva
      - Puente Aranda: Zona industrial, comedores económicos

    💰 RANGOS DE PRECIO DEFINIDOS:
    • BAJO ($10,000 - $25,000): Comedores populares, comida callejera, mercados
    • MEDIO ($25,000 - $60,000): Restaurantes familiares, comida casual, algunos temáticos
    • ALTO ($60,000+): Restaurantes gourmet, fine dining, experiencias premium

    🍽️ TIPOS DE COMIDA DISPONIBLES:
    • Colombiana tradicional: Ajiaco, bandeja paisa, tamales
    • Comida rápida: Hamburguesas, pizzas, sandwiches gourmet
    • Internacional: Mexicana, italiana, china, japonesa, árabe
    • Saludable: Vegetariana, vegana, orgánica, bowls
    • Fusión: Combinaciones innovadoras
    • Comida callejera: Arepas, empanadas, salchipapas

    PREGUNTA CLAVE SIEMPRE:
    • Si el usuario no especifica localidad, pregunta: "¿En qué zona de Bogotá te encuentras o prefieres?"
    • Si no especifica presupuesto, pregunta: "¿Qué rango de precio tienes en mente?"

    Si te preguntan algo no relacionado, responde: "Soy tu experto en comida bogotana 🍽️ ¿En qué zona de Bogotá quieres comer hoy?"

    🚫 **NO INCLUIR NUNCA AL FINAL:**
    - "¡Espero que disfrutes mucho tu comida!"
    - "Si tienes alguna otra pregunta, no dudes en consultarme"
    - Cualquier frase de despedida adicional

    ✅ **TERMINAR DIRECTAMENTE** después de la última recomendación.

    Recuerda: Usa ***triple asterisco*** para títulos, **doble asterisco** para información clave y *asterisco simple* para detalles descriptivos.`;

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

      // Create assistant message placeholder
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Process streaming response
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

      // Extraer restaurantes para el asistente y pueda responder
      const extractRestaurants = (content: string): Restaurant[] => {
        const restaurants: Restaurant[] = [];

        // Limpiar el contenido de formato markdown para el parsing
        const cleanContent = content
          .replace(/\*\*\*/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '');

        const coordPattern = /Coordenadas:\s*([-\d.]+),\s*([-\d.]+)/gi;
        const namePattern = /🍽️\s*([^\n-]+)/i;
        const addressPattern = /Dirección:\s*([^\n]+)/i;
        const websitePattern = /Sitio web:\s*([^\n]+)/i;

        // Dividir por secciones de restaurantes
        const sections = cleanContent.split(/(?=🍽️)/);

        for (const section of sections) {
          const coordMatch = coordPattern.exec(section);
          if (coordMatch) {
            const nameMatch = section.match(namePattern);
            const addressMatch = section.match(addressPattern);
            const websiteMatch = section.match(websitePattern);

            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);

            // Validar que sean coordenadas de Bogotá
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

      // Update restaurants after message is complete
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "assistant") {
          const extracted = extractRestaurants(lastMessage.content);
          if (extracted.length > 0) {
            setRestaurants(extracted);
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

      // Remove the empty assistant message if there was an error
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Welcome Section */}
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

          {/* Quick Suggestions */}
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

          {/* Message History */}
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
                content="Buscando las mejores opciones para ti... 🔍🍴✨"
                timestamp={new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Map */}
          {restaurants.length > 0 && (
            <div className="mt-6 rounded-xl overflow-hidden shadow-2xl border border-border">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  📍 Ubicaciones Recomendadas
                </h3>
              </div>
              <div className="relative">
                <MapContainer
                  center={[restaurants[0].lat, restaurants[0].lng]}
                  zoom={13}
                  style={{ height: "500px", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {restaurants.map((restaurant, idx) => (
                    <Marker 
                      key={idx} 
                      position={[restaurant.lat, restaurant.lng]}
                      icon={createCustomIcon()}
                    >
                      <Popup className="custom-popup" maxWidth={300}>
                        <div className="p-3">
                          <h4 className="font-bold text-lg mb-3 text-foreground border-b border-border pb-2">
                            {restaurant.name}
                          </h4>
                          {restaurant.address && (
                            <div className="flex items-start gap-2 mb-2">
                              <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                            </div>
                          )}
                          {restaurant.website && (
                            <a
                              href={restaurant.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Visitar sitio web
                            </a>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  <MapControls />
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Escribe o habla con el asistente..."
                className="pr-12 h-12 rounded-full border-border"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-10 w-10"
                onClick={() => console.log("Voice input clicked")}
              >
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="h-12 w-12 rounded-full"
              disabled={!inputMessage.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Powered by AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatIA;
