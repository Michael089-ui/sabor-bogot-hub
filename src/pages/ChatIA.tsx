import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const ChatIA = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy Sabor Capaital, tu experto en resturantes de Bogotá. ¿Qué tipo de comida te apetece hoy?",
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
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
    5. Incluye siempre: tipo de comida, rango de precios, zona y especialidad
    6. Usa emojis moderadamente para mantener un tono amigable y profesional
    7. ADAPTA tus recomendaciones según la localidad que mencione el usuario
    8. Si detectas que la pregunta no es sobre comida/restaurantes, redirige amablemente al tema culinario

    FORMATO PARA RECOMENDACIONES:
    🏆 [Nombre Restaurante]
    🍽️ Tipo: [tipo de comida]
    💰 Precio: [bajo|medio|alto]  
    📍 Zona: [localidad/barrio]
    ⭐ Especialidad: [plato destacado]
    🚗 [Transporte/ubicación si es relevante]

    BASE DE CONOCIMIENTO COMPLETA DE BOGOTÁ:

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

    EJEMPLOS DE RECOMENDACIONES POR ZONA:

    📍 BOSA (Económico):
    "Para comida económica en Bosa te recomiendo:
    🏆 Donde Toño
    🍽️ Tipo: Comida colombiana
    💰 Precio: Bajo
    📍 Zona: Bosa Centro
    ⭐ Especialidad: Bandeja paisa casera

    🏆 La Esquina del Sabor  
    🍽️ Tipo: Comida rápida
    💰 Precio: Bajo
    📍 Zona: Bosa - MetroBosa
    ⭐ Especialidad: Hamburguesas artesanales"

    📍 CHAPINERO (Medio-Alto):
    "En Chapinero tienes opciones variadas:
    🏆 Harry Sasson
    🍽️ Tipo: Fusión internacional
    💰 Precio: Alto
    📍 Zona: Chapinero - Zona G
    ⭐ Especialidad: Cocina de autor

    🏆 Wok
    🍽️ Tipo: Asiática fusión
    💰 Precio: Medio-Alto
    📍 Zona: Chapinero - Parque 93
    ⭐ Especialidad: Noodles y woks"

    📍 KENNEDY (Económico-Medio):
    "En Kennedy encuentras:
    🏆 Frisby
    🍽️ Tipo: Pollo frito
    💰 Precio: Medio
    📍 Zona: Kennedy - CC Plaza de las Américas
    ⭐ Especialidad: Alitas picantes

    🏆 Crepes & Waffles
    🍽️ Tipo: Internacional
    💰 Precio: Medio
    📍 Zona: Varias locaciones
    ⭐ Especialidad: Crepes salados y dulces"

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
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Hola, soy tu asistente
            </h1>
            <p className="text-muted-foreground">
              Puedo ayudarte a encontrar restaurantes y platos en Bogotá. ¿Qué buscas hoy?
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
                content="Buscando las mejores opciones para ti... 🍴"
                timestamp={new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
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
