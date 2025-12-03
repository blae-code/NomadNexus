import { motion } from "framer-motion";
import { ActivitySquare, Cloud, Radio } from "lucide-react";
import { NexusBadge } from "../components/ui/SciFiComponents";

interface TheTickerProps {
  messages?: string[];
}

const defaultMessages = [
  "DRIVE SAFE - NO UNAUTHORIZED QUANTUM JUMPS",
  "CARGO MANIFEST LOCKED - VERIFY AT HANGAR 03",
  "SURVEILLANCE ARRAY CALIBRATED - SIGNAL STABLE",
  "ENGINEERING: COOLANT MIX RATIO AT 0.82",
  "REFUEL BAY OPEN - PRIORITY FOR SCOUT WINGS",
];

export const TheTicker = ({ messages = defaultMessages }: TheTickerProps) => {
  const marquee = `${messages.join(" // ")} //`;

  return (
    <header className="flex items-center gap-4 border-b border-slate-800 bg-gunmetal px-4 py-3 text-tech-white uppercase tracking-[0.12em]">
      <div className="flex items-center gap-2 text-xs">
        <ActivitySquare className="h-4 w-4 text-indicator-green" />
        <span className="text-slate-300">System Status</span>
        <NexusBadge status="online" label="OPERATIONAL" />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <motion.div
          className="flex min-w-full gap-12 text-sm text-slate-200"
          animate={{ x: ["0%", "-100%"] }}
          transition={{ repeat: Infinity, repeatType: "loop", duration: 22, ease: "linear" }}
        >
          <span>{marquee}</span>
          <span aria-hidden className="pl-12">{marquee}</span>
        </motion.div>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-200">
        <Radio className="h-4 w-4 text-burnt-orange" />
        <span className="text-slate-400">Comm Net</span>
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-slate-300" />
          <span>MICROTECH: -120°C // WIND: 40KT</span>
        </div>
      </div>
    </header>
  );
};

export default TheTicker;
