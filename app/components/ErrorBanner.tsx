"use client";

interface ErrorBannerProps {
  type: "error" | "warning" | "info";
  message: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
}

const STYLES = {
  error: { bg: "rgba(255, 61, 113, 0.13)", border: "#ff3d71", text: "#ff3d71" },
  warning: { bg: "rgba(251, 191, 36, 0.13)", border: "#fbbf24", text: "#fbbf24" },
  info: { bg: "rgba(0, 229, 255, 0.13)", border: "#00e5ff", text: "#00e5ff" },
};

export default function ErrorBanner({ type, message, action, dismissible, onDismiss }: ErrorBannerProps) {
  const s = STYLES[type];
  return (
    <div
      className="w-full px-4 py-2 flex items-center justify-between gap-3 text-sm font-mono shrink-0"
      style={{ backgroundColor: s.bg, borderBottom: `1px solid ${s.border}`, color: s.text }}
    >
      <span className="flex-1">{message}</span>
      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-bold px-3 py-1 rounded transition-colors"
            style={{ backgroundColor: s.border, color: "#0a0e17" }}
          >
            {action.label}
          </button>
        )}
        {dismissible && onDismiss && (
          <button onClick={onDismiss} className="text-xs hover:opacity-70 transition-opacity">✕</button>
        )}
      </div>
    </div>
  );
}
