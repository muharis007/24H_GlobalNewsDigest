"use client";

interface LoadingOverlayProps {
  status?: string | null;
}

export default function LoadingOverlay({ status }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning ring */}
        <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-text-main font-heading font-semibold text-lg">
            {status || "Scanning sources..."}
          </p>
          <p className="text-text-dim text-xs font-mono mt-1">
            Searching 4 sources via Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
}
