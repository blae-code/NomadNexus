import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Volume2, Target, MessageSquare, ShieldCheck } from 'lucide-react';

const holoCards = [
  {
    id: 'ops-1',
    title: 'Fleet Exercise',
    message: "NOMAD FLEET EXERCISE 'RED SHIFT' COMMENCING. All hands to stations.",
    action: 'Acknowledge',
    voiceIntent: 'acknowledge alert one',
    badge: 'PRIORITY',
  },
  {
    id: 'ops-2',
    title: 'Unknown Signature',
    message: 'Unregistered signature detected in Sector Gamma-7. Plot avoidance? ',
    action: 'Plot Avoid',
    voiceIntent: 'mark waypoint',
    badge: 'THREAT',
  },
  {
    id: 'ops-3',
    title: 'Riggsy Hydrate',
    message: "Riggsy: Hydration check. Reaction time drops when you forget the water." ,
    action: 'Log Wellness',
    voiceIntent: 'log hydration',
    badge: 'REMINDER',
  },
  {
    id: 'ops-4',
    title: 'Supply Convoy',
    message: 'Supply convoy inbound. Docking ETA 03:20:00. Prep moorings and request clearance.',
    action: 'Prep Dock',
    voiceIntent: 'open dock brief',
    badge: 'MISSION',
  },
];

const HoloBoard = ({ isListening = false }) => {
  const [current, setCurrent] = useState(0);
  const [actionLog, setActionLog] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % holoCards.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = (card) => {
    setActionLog((prev) => [
      `[HOLO] ${card.title} → ${card.action} @ ${new Date().toLocaleTimeString()}`,
      ...prev.slice(0, 4),
    ]);
  };

  return (
    <div className="w-full bg-gunmetal border-b border-burnt-orange py-3 px-4 overflow-hidden relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-amber-200">
          <Volume2 className="w-4 h-4" />
          HoloBoard Calls to Action
        </div>
        <div className="flex items-center gap-2 text-[10px] text-amber-300">
          <span className="px-2 py-1 border border-burnt-orange/60 bg-burnt-orange/10">Say "acknowledge"</span>
          {isListening && <span className="px-2 py-1 border border-amber-400/60 bg-amber-500/20">Listening</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {holoCards.map((card, index) => (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'border px-3 py-2 bg-black/50 relative overflow-hidden group',
              isListening && index === current ? 'border-burnt-orange shadow-[0_0_12px_rgba(234,88,12,0.3)]' : 'border-zinc-700'
            )}
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-burnt-orange/60 via-amber-400/70 to-burnt-orange/60" />
            <div className="flex items-center justify-between text-[10px] text-amber-300 uppercase">
              <span>#{index + 1} {card.title}</span>
              <span className="px-1.5 py-0.5 border border-amber-500/50 bg-amber-500/10">{card.badge}</span>
            </div>
            <p className="text-sm text-tech-white mt-1 leading-tight">{card.message}</p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-amber-200">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" />Say "{card.voiceIntent}"</span>
              <button
                onClick={() => handleAction(card)}
                className="px-2 py-1 border border-burnt-orange/70 bg-burnt-orange/10 text-tech-white uppercase text-[10px] tracking-[0.15em]"
              >
                {card.action}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 border-t border-burnt-orange/50 pt-2 grid grid-cols-[1fr_220px] gap-3 text-[11px] text-tech-white/70">
        <div className="flex items-center gap-2 text-amber-200">
          <MessageSquare className="w-4 h-4" />
          Next card auto-rotates every 8s. Hold ALT to glow the target card.
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-amber-300" />
          <div className="flex-1 truncate">{actionLog[0] || 'Awaiting holo-actions...'}</div>
        </div>
      </div>
    </div>
  );
};

export default HoloBoard;
