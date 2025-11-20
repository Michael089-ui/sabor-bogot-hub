import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles, MapPin, ExternalLink } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
    "🎉 Sitios con buena música en vivo",
    "🏙️ Rooftops con vista a la ciudad",
    "👨‍👩‍👧‍👦 Restaurantes familiares",
    "💼 Lugares para reuniones de negocio",
    "🚗 Con parqueadero incluido"
  ];

  const systemPrompt = `Eres "Sabor Capital", un experto EXCLUSIVO en recomendaciones gastronómicas de Bogotá. 

    ⚠️ REGLAS ABSOLUTAMENTE ESTRICTAS:
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
    11. NUNCA uses "***" para resaltar - usa SOLO "-" o emoticonos de comida (🍕🍔🍝🍜🍱🥘🌮🍛🍲🥗🍳)

    FORMATO OBLIGATORIO PARA RECOMENDACIONES (INCLUYE SIEMPRE LAS COORDENADAS):
    
    🍽️ [Nombre Restaurante]
    - Tipo: [tipo de comida]
    - Precio: [bajo|medio|alto]  
    - Zona: [localidad/barrio específico]
    - Dirección: [dirección completa]
    - Coordenadas: [latitud], [longitud]
    - Especialidad: [plato destacado]
    - Sitio web: [URL si está disponible]
    - Teléfono: [número si es relevante]

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

    EJEMPLOS DE RECOMENDACIONES POR ZONA (SIEMPRE CON COORDENADAS):

    📍 BOSA (Económico):
    "Para comida económica en Bosa te recomiendo estos lugares deliciosos 🍴✨:
    
    🏆 Donde Toño
    🍽️ Tipo: Comida colombiana tradicional
    💰 Precio: Bajo ($15,000 - $25,000)
    📍 Zona: Bosa Centro
    📌 Coordenadas: 4.6187, -74.1927
    ⭐ Especialidad: Bandeja paisa casera espectacular 😋
    🕐 Horario: Lun-Sab 11am-8pm

    🏆 La Esquina del Sabor  
    🍽️ Tipo: Comida rápida gourmet
    💰 Precio: Bajo ($12,000 - $20,000)
    📍 Zona: Bosa - MetroBosa
    📌 Coordenadas: 4.6321, -74.1893
    ⭐ Especialidad: Hamburguesas artesanales con ingredientes frescos 🍔"

    📍 CHAPINERO (Medio-Alto):
    "En Chapinero tienes opciones fantásticas 🌟:
    
    🏆 Harry Sasson
    🍽️ Tipo: Fusión internacional de alto nivel
    💰 Precio: Alto ($80,000 - $150,000)
    📍 Zona: Chapinero - Zona G
    📌 Coordenadas: 4.6653, -74.0548
    ⭐ Especialidad: Cocina de autor con influencias colombianas 👨‍🍳
    📱 Tel: 601 3422799

    🏆 Wok
    🍽️ Tipo: Asiática fusión moderna
    💰 Precio: Medio-Alto ($40,000 - $70,000)
    📍 Zona: Chapinero - Parque 93
    📌 Coordenadas: 4.6730, -74.0475
    ⭐ Especialidad: Noodles y woks personalizados 🍜✨"

    📍 KENNEDY (Económico-Medio):
    "En Kennedy encuentras excelentes opciones 🎉:
    
    🏆 Frisby
    🍽️ Tipo: Pollo frito estilo colombiano
    💰 Precio: Medio ($25,000 - $40,000)
    📍 Zona: Kennedy - CC Plaza de las Américas
    📌 Coordenadas: 4.6155, -74.1402
    ⭐ Especialidad: Alitas picantes irresistibles 🍗🔥

    🏆 Crepes & Waffles
    🍽️ Tipo: Internacional casual
    💰 Precio: Medio ($30,000 - $50,000)
    📍 Zona: Kennedy Central
    📌 Coordenadas: 4.6284, -74.1378
    ⭐ Especialidad: Crepes salados y dulces deliciosos 🧇💕"

    PREGUNTA CLAVE SIEMPRE:
    • Si el usuario no especifica localidad, pregunta: "¿En qué zona de Bogotá te encuentras o prefieres?"
    • Si no especifica presupuesto, pregunta: "¿Qué rango de precio tienes en mente?"

    Si te preguntan algo no relacionado, responde: "Soy tu experto en comida bogotana 🍽️ ¿En qué zona de Bogotá quieres comer hoy?"`;

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

      // Extract restaurants from the assistant's response
      const extractRestaurants = (content: string): Restaurant[] => {
        const restaurants: Restaurant[] = [];
        const coordPattern = /Coordenadas:\s*([-\d.]+),\s*([-\d.]+)/gi;
        const namePattern = /🍽️\s*(.+?)(?:\n|-)/i;
        const addressPattern = /Dirección:\s*(.+?)(?:\n|$)/i;
        const websitePattern = /Sitio web:\s*(.+?)(?:\n|$)/i;
        
        // Split by restaurant sections (looking for the food emoji pattern)
        const sections = content.split(/(?=🍽️)/);
        
        for (const section of sections) {
          const coordMatch = coordPattern.exec(section);
          if (coordMatch) {
            const nameMatch = section.match(namePattern);
            const addressMatch = section.match(addressPattern);
            const websiteMatch = section.match(websitePattern);
            
            restaurants.push({
              name: nameMatch ? nameMatch[1].trim() : "Restaurante",
              lat: parseFloat(coordMatch[1]),
              lng: parseFloat(coordMatch[2]),
              address: addressMatch ? addressMatch[1].trim() : undefined,
              website: websiteMatch ? websiteMatch[1].trim() : undefined
            });
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
            <div className="mt-6 rounded-lg overflow-hidden shadow-lg border-2 border-primary/20">
              <div className="bg-gradient-primary p-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Ubicaciones Recomendadas
                </h3>
              </div>
              <MapContainer
                center={[restaurants[0].lat, restaurants[0].lng]}
                zoom={13}
                style={{ height: "400px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {restaurants.map((restaurant, idx) => (
                  <Marker key={idx} position={[restaurant.lat, restaurant.lng]}>
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-bold text-lg mb-2">{restaurant.name}</h4>
                        {restaurant.address && (
                          <p className="text-sm mb-1">
                            <MapPin className="inline w-3 h-3 mr-1" />
                            {restaurant.address}
                          </p>
                        )}
                        {restaurant.website && (
                          <a
                            href={restaurant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Visitar sitio web
                          </a>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
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
