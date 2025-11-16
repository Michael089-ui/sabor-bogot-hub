import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";

const ChatIA = () => {
  const [inputMessage, setInputMessage] = useState("");

  // Mock conversation history
  const mockMessages = [
    {
      role: "assistant" as const,
      content: "Hola, soy tu asistente. ¿En qué puedo ayudarte hoy a encontrar los mejores sabores de Bogotá?",
      timestamp: "10:30 AM"
    },
    {
      role: "user" as const,
      content: "Busco un restaurante italiano cerca de la Zona Rosa",
      timestamp: "10:32 AM"
    },
    {
      role: "assistant" as const,
      content: "¡Excelente elección! Te recomiendo varios restaurantes italianos en la Zona Rosa. ¿Prefieres algo romántico o casual? ¿Cuál es tu presupuesto aproximado?",
      timestamp: "10:32 AM"
    }
  ];

  // Quick suggestion prompts
  const quickSuggestions = [
    "¿Buscas algo en específico?",
    "Te puedo recomendar lugares según tus gustos",
    "¿Lugares románticos?",
    "¿Comida barata cerca de mí?"
  ];

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      // Logic will be added later
      console.log("Sending:", inputMessage);
      setInputMessage("");
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
            {mockMessages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
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
              disabled={!inputMessage.trim()}
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
