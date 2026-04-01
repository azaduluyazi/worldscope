"use client";

// Note: metadata export not supported in client components — handled by layout

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#050a12] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="text-6xl opacity-60">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-mono font-bold text-[#00e5ff] tracking-wide">
          YOU ARE OFFLINE
        </h1>

        {/* Description */}
        <p className="text-sm font-mono text-[#a0aec0] leading-relaxed">
          Your internet connection appears to be unavailable.
          Previously cached intelligence data may still be accessible.
        </p>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#ff4757]">
          <span className="w-2 h-2 rounded-full bg-[#ff4757] animate-pulse" />
          CONNECTION LOST
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded text-sm font-mono text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:border-[#00e5ff]/50 transition-colors cursor-pointer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          RETRY CONNECTION
        </button>

        {/* Footer note */}
        <p className="text-[10px] font-mono text-[#4a5568] pt-4">
          WorldScope will automatically reconnect when your network is restored.
        </p>
      </div>
    </div>
  );
}
