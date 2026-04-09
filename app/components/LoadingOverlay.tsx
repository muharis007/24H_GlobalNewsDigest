"use client";

interface LoadingOverlayProps {
  status?: string | null;
}

export default function LoadingOverlay({ status }: LoadingOverlayProps) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <div className="flex items-center gap-3 bg-surface/95 border border-border rounded-lg px-4 py-2.5 shadow-lg backdrop-blur-sm">
        <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin shrink-0" />
        <p className="text-text-main font-mono text-sm whitespace-nowrap">
          {status || "Scanning sources..."}
        </p>
      </div>
    </div>
  );
}
