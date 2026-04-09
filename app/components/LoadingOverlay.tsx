"use client";

import { useState, useEffect } from "react";

const ROTATING_MESSAGES = [
  "Scanning RSS feeds...",
  "Reading ARY News...",
  "Reading Geo TV...",
  "Reading Arab News...",
  "Reading BBC...",
  "Sending to Gemini AI...",
  "Categorizing by country...",
  "Almost there...",
];

interface LoadingOverlayProps {
  status?: string | null;
  startedAt?: number;
}

export default function LoadingOverlay({ status, startedAt }: LoadingOverlayProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % ROTATING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const check = setInterval(() => {
      if (Date.now() - startedAt > 30000) setSlow(true);
    }, 5000);
    return () => clearInterval(check);
  }, [startedAt]);

  const displayMessage = status || ROTATING_MESSAGES[msgIndex];

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center" style={{ background: "rgba(10, 14, 23, 0.85)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-border border-t-accent rounded-full animate-spin" />
        <p className="text-text-main font-mono text-sm text-center">
          {displayMessage}
        </p>
        {slow && (
          <p className="text-text-dim font-mono text-xs text-center">
            This is taking longer than usual. Please wait...
          </p>
        )}
      </div>
    </div>
  );
}
