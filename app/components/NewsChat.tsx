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
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-0 md:p-4" style={{ background: "color-mix(in srgb, var(--bg) 95%, transparent)" }}>
      <div
        className="w-full h-full md:max-w-lg md:h-[70vh] flex flex-col overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>Ask the News</h2>
          <button
            onClick={onClose}
            className="font-data text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-dim)" }}
          >
            Close
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="font-serif-body text-sm" style={{ color: "var(--text-dim)" }}>
                Ask anything about today&apos;s news.
              </p>
              <p className="font-serif-body text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                e.g. &quot;What&apos;s happening in Pakistan?&quot; or &quot;Summarize the conflicts.&quot;
              </p>
              <p className="font-data text-[9px] mt-3 uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)", opacity: 0.6 }}>
                Answers are AI-generated and may contain inaccuracies.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[80%] px-3 py-2 text-sm"
                style={
                  msg.role === "user"
                    ? { background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)", fontFamily: "var(--font-data, monospace)", fontSize: "13px" }
                    : { background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)", fontFamily: "var(--font-serif, serif)", fontSize: "14px", lineHeight: "1.6" }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div
                className="px-3 py-2 text-sm animate-pulse font-data"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
              >
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about the news..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
              className="flex-1 font-serif-body text-sm px-3 py-2 focus:outline-none disabled:opacity-50"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="font-data text-sm font-bold px-4 py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-[0.05em]"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
