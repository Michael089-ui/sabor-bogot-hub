import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const ChatMessage = ({ role, content, timestamp }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex gap-3 max-w-[80%]", isUser && "flex-row-reverse")}>
        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          {isUser ? "U" : "IA"}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              "rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl",
              isUser
                ? "bg-gradient-primary text-white rounded-tr-sm"
                : "bg-gradient-subtle text-foreground border-2 border-primary/20 rounded-tl-sm"
            )}
          >
            <p className="text-base leading-relaxed font-medium whitespace-pre-wrap">{content}</p>
          </div>
          {timestamp && (
            <span className={cn("text-xs text-muted-foreground px-2", isUser && "text-right")}>
              {timestamp}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
