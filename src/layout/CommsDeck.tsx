import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Radio, Signal, Waveform } from "lucide-react";
import { NexusBadge, NexusButton, NexusCard } from "../components/ui/SciFiComponents";

type DeckTab = "comms" | "intel" | "audio";

interface CommsDeckProps {
  isOpen: boolean;
}

const tabCopy: Record<DeckTab, string> = {
  comms: "Incoming Transmission",
  intel: "Operational Intel Grid",
  audio: "Audio Stream Monitor",
};

const StatCard = ({ title, value, meta }: { title: string; value: string; meta: string }) => (
  <NexusCard title={title} meta={meta} className="h-full">
    <div className="text-2xl font-semibold text-tech-white">{value}</div>
  </NexusCard>
);

export const CommsDeck = ({ isOpen }: CommsDeckProps) => {
  const [activeTab, setActiveTab] = useState<DeckTab>("comms");

  return (
    <motion.section
      initial={{ y: "100%" }}
      animate={{ y: isOpen ? "0%" : "100%" }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className="absolute bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3 text-xs uppercase tracking-[0.14em] text-slate-300">
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-burnt-orange" />
          <span>{tabCopy[activeTab]}</span>
          <NexusBadge status="online" label="Channel: Secure" />
        </div>
        <div className="flex items-center gap-3">
          <NexusButton
            variant={activeTab === "comms" ? "primary" : "ghost"}
            onClick={() => setActiveTab("comms")}
            icon={<MessageSquare className="h-4 w-4" />}
          >
            Comms
          </NexusButton>
          <NexusButton
            variant={activeTab === "intel" ? "primary" : "ghost"}
            onClick={() => setActiveTab("intel")}
            icon={<Signal className="h-4 w-4" />}
          >
            Intel
          </NexusButton>
          <NexusButton
            variant={activeTab === "audio" ? "primary" : "ghost"}
            onClick={() => setActiveTab("audio")}
            icon={<Waveform className="h-4 w-4" />}
          >
            Audio
          </NexusButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-5 text-tech-white md:grid-cols-3">
        <div className="md:col-span-2">
          {activeTab === "comms" && (
            <div className="space-y-3 border border-slate-800 p-4">
              <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
                <span className="text-burnt-orange">[IN]</span>
                <div>
                  <p className="text-xs text-slate-300">SENTINEL-NODE // 19:32 UET</p>
                  <p className="text-sm text-tech-white">Ghost signatures near ArcCorp lanes. Recommend rerouting haulers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indicator-green">[SYS]</span>
                <div>
                  <p className="text-xs text-slate-300">AUTOMATA // 19:30 UET</p>
                  <p className="text-sm text-tech-white">Telemetry steady. No packet loss detected across frontier relays.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400">[PRIO]</span>
                <div>
                  <p className="text-xs text-slate-300">TACNET // 19:26 UET</p>
                  <p className="text-sm text-tech-white">Encrypted ping from unregistered beacon. Awaiting telemetry packet...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "intel" && (
            <div className="grid grid-cols-2 gap-4 border border-slate-800 p-4">
              <StatCard title="Server FPS" value="58" meta="Nomad Core" />
              <StatCard title="Active Members" value="128" meta="Clan Online" />
              <StatCard title="Threat Level" value="ELEVATED" meta="Perimeter" />
              <StatCard title="Uptime" value="99.98%" meta="Last 24h" />
            </div>
          )}

          {activeTab === "audio" && (
            <div className="flex h-full flex-col justify-center gap-3 border border-slate-800 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Audio Spectrum</div>
              <div className="flex h-24 items-end gap-2">
                {[...Array(18)].map((_, index) => (
                  <motion.span
                    key={index}
                    className="w-3 flex-1 bg-burnt-orange"
                    animate={{
                      height: ["20%", `${60 + (index % 5) * 8}%`, "35%"],
                    }}
                    transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.8 + index * 0.05 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3 border border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-300">
            <span>Deck Status</span>
            <NexusBadge status={isOpen ? "online" : "offline"} label={isOpen ? "Open" : "Sealed"} />
          </div>
          <p className="text-sm text-slate-200">Comms Deck is {isOpen ? "live" : "stowed"}. Override only with bridge approval.</p>
          <div className="grid grid-cols-2 gap-3 text-[12px] uppercase tracking-[0.12em] text-slate-400">
            <span>Encryption: AES-512</span>
            <span>Relay: SPINE-NX</span>
            <span>Channel: Secure</span>
            <span>Signal: 5/5</span>
          </div>
        </aside>
      </div>
    </motion.section>
  );
};

export default CommsDeck;
