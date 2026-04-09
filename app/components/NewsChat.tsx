"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { NewsData } from "@/types/news";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface NewsChatProps {
  news: NewsData;
  onClose: () => void;
}

function buildContext(news: NewsData): string {
  return news.countries
    .map((c) => {
      const stories = c.stories
        .map((s) => `  - [${s.category}] ${s.headline}: ${s.summary}`)
        .join("\n");
      return `${c.name} (${c.code}):\n${stories}`;
    })
    .join("\n\n");
}

export default function NewsChat({ news, onClose }: NewsChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const context = useRef(buildContext(news));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: context.current }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || data.error || "No response" },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to get response." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className="fixed inset-0 z-[9998] bg-bg/95 flex items-center justify-center p-0 md:p-4">
      <div className="w-full h-full md:max-w-lg md:h-[70vh] bg-surface border-0 md:border border-border md:rounded-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-heading font-bold text-text-main text-lg">Ask the News</h2>
          <button onClick={onClose} className="text-text-dim hover:text-accent-2 text-sm font-mono">✕</button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-text-dim text-xs font-mono py-8">
              Ask anything about today&apos;s news.<br />
              e.g. &quot;What&apos;s happening in Pakistan?&quot; or &quot;Summarize the conflicts.&quot;
              <p className="mt-3 text-[10px] text-text-dim/60">Answers are AI-generated and may contain inaccuracies.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-accent/20 text-accent font-mono"
                    : "bg-surface-2 text-text-main border border-border"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-dim font-mono animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about the news..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
              className="flex-1 bg-surface-2 border border-border text-text-main text-sm font-mono rounded px-3 py-2 focus:outline-none focus:border-accent/50 placeholder:text-text-dim disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-accent text-bg font-bold text-sm px-4 py-2 rounded hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-mono"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
