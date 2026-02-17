import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Brain,
  Lightbulb,
} from "lucide-react";
import type { ChatMessage } from "@/lib/lease-redline/types";
import { ReasoningDisplay } from "./ReasoningDisplay";
import { FinancialModelCard } from "./FinancialModelCard";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClear: () => void;
  contextualSuggestions?: string[];
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted border border-border"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Reasoning toggle */}
        {!isUser && message.reasoning && message.reasoning.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Brain className="h-3 w-3" />
              <span>
                {showReasoning ? "Hide" : "Show"} reasoning ({message.reasoning.length} steps)
              </span>
              {showReasoning ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showReasoning && (
              <ReasoningDisplay steps={message.reasoning} />
            )}
          </div>
        )}

        {/* Financial Model */}
        {!isUser && message.financialModel && (
          <div className="mt-3">
            <FinancialModelCard model={message.financialModel} />
          </div>
        )}

        {/* Suggestions */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
              <Lightbulb className="h-3 w-3" />
              <span>Suggested follow-ups:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className="text-xs px-2 py-1 rounded-md bg-background border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  onClick={() => {
                    // Find the chat input and set value
                    const input = document.getElementById("chat-input") as HTMLTextAreaElement;
                    if (input) {
                      input.value = suggestion;
                      input.focus();
                      // Trigger a React onChange
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLTextAreaElement.prototype,
                        "value"
                      )?.set;
                      nativeInputValueSetter?.call(input, suggestion);
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Revision reference */}
        {!isUser && message.revisionRef && (
          <div className="mt-1 text-xs text-muted-foreground">
            Re: Clause #{message.revisionRef}
          </div>
        )}

        <div className="text-[10px] mt-1 opacity-60">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

export function ChatPanel({
  messages,
  isLoading,
  error,
  onSendMessage,
  onClear,
  contextualSuggestions,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader
        className="cursor-pointer hover:bg-muted/30 transition-colors py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Chat with Agent
            {messages.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({messages.length} messages)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="h-7 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Messages area */}
          <div
            ref={scrollRef}
            className="max-h-[400px] overflow-y-auto space-y-3 pr-1"
          >
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-6">
                <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Ask questions about specific clauses, request financial
                  analysis, or discuss negotiation strategy.
                </p>
                {/* Contextual suggestions */}
                {contextualSuggestions && contextualSuggestions.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {contextualSuggestions.map((s, i) => (
                      <p key={i} className="text-xs text-primary/80 italic">
                        {s}
                      </p>
                    ))}
                  </div>
                )}
                {/* Starter prompts */}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => {
                        setInput(prompt);
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Input area */}
          <div className="flex gap-2">
            <Textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a clause, request financial analysis..."
              className="min-h-[44px] max-h-[120px] text-sm resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="shrink-0 self-end"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

const STARTER_PROMPTS = [
  "What are the biggest financial risks?",
  "Calculate the rent escalation impact",
  "How does the TI amortization work here?",
  "What's my negotiation leverage?",
  "Explain the co-tenancy exposure",
];
