import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2, ExternalLink
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/contexts/ChatContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ChatMessage from "@/components/ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const quickSuggestions = [
  "🍴 Restaurantes románticos",
  "💰 Comida económica",
  "🥗 Opciones vegetarianas",
  "🇨🇴 Comida colombiana",
];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();

  // Initialize with welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "¡Hola! 👋 Soy Sabor Capital, tu experto en restaurantes de Bogotá 🍽️✨\n\n¿Qué tipo de comida te apetece hoy?",
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInputMessage(initialPrompt);
      clearInitialPrompt();
      // Auto-send after a small delay
      setTimeout(() => {
        handleSend(initialPrompt);
      }, 300);
    }
  }, [initialPrompt, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        `https://ozladdazcubyvmgdpyop.supabase.co/functions/v1/chat`,
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <SheetContent className="w-full sm:w-[500px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle className="text-lg">Sabor Capital IA</SheetTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleOpenFullChat}
              className="gap-1 text-xs"
            >
              Ver en pantalla completa
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id || index}
                role={message.role}
                content={message.content}
                timestamp={typeof message.timestamp === 'string' 
                  ? message.timestamp 
                  : message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                }
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Pensando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    setInputMessage(suggestion);
                  }}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
