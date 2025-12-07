import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

export function FloatingChatButton() {
  const { isOpen, toggleChat, messages } = useChat();
  
  const hasActiveConversation = messages.length > 0;

  return (
    <Button
      onClick={toggleChat}
      size="lg"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
        "bg-primary hover:bg-primary/90",
        isOpen && "rotate-90"
      )}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <>
          <Sparkles className="h-6 w-6" />
          {hasActiveConversation && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive animate-pulse" />
          )}
        </>
      )}
    </Button>
  );
}
