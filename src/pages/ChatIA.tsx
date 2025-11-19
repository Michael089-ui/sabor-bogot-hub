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
      content: "Hola, soy tu asistente. ¿En qué puedo ayudarte hoy a encontrar los mejores sabores de Bogotá?",
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Quick suggestion prompts
  const quickSuggestions = [
    "¿Buscas algo en específico?",
    "Te puedo recomendar lugares según tus gustos",
    "¿Lugares románticos?",
    "¿Comida barata cerca de mí?"
  ];

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
                content="Escribiendo..."
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
