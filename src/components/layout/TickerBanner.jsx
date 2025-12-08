import React from "react";

// Example messages; in production, fetch from API or context
const messages = [
  "⚡ SYSTEM ALERT: Scheduled maintenance at 0200 UTC.",
  "🛡️ SECURITY: All hands, report suspicious activity immediately.",
  "🚀 MISSION: New deployment window opens in 12 hours.",
  "💡 TIP: Use /help for quick command reference.",
];

export default function TickerBanner() {
  return (
    <div className="w-full bg-black border-b-2 border-[var(--burnt-orange)] overflow-hidden h-10 flex items-center relative z-40 shadow-[0_2px_12px_rgba(234,88,12,0.08)]">
      <div className="whitespace-nowrap animate-marquee text-[15px] font-mono text-amber-200 px-8 tracking-wide flex gap-16 drop-shadow-[0_0_6px_#ea580c55]">
        {messages.map((msg, i) => (
          <span key={i}>{msg}</span>
        ))}
      </div>
    </div>
  );
}
