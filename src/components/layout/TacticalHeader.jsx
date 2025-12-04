import React, { useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";

const formatUTC = () => {
  const now = new Date();
  const hh = now.getUTCHours().toString().padStart(2, "0");
  const mm = now.getUTCMinutes().toString().padStart(2, "0");
  const ss = now.getUTCSeconds().toString().padStart(2, "0");
  const ms = now.getUTCMilliseconds().toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}:${ms}`;
};

export default function TacticalHeader() {
  const [clock, setClock] = useState(formatUTC());
  const [bars, setBars] = useState([8, 12, 16, 12, 10]);
  const [flicker, setFlicker] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(formatUTC());
      setBars((prev) =>
        prev.map((_, idx) => {
          const base = [8, 10, 14, 10, 8][idx] || 10;
          const jitter = Math.floor(Math.random() * 6);
          return base + jitter;
        })
      );
    }, 1000);
    const flickerTimer = setTimeout(() => setFlicker(false), 500);
    return () => {
      clearInterval(interval);
      clearTimeout(flickerTimer);
    };
  }, []);

  const funds = useMemo(() => "24,050,000 aUEC", []);
  const clockParts = clock.split(":");

  return (
    <div className="h-16 w-full bg-black border-b-2 border-[var(--burnt-orange)] shadow-[0_4px_12px_rgba(204,85,0,0.25)] grid grid-cols-[300px_1fr_300px] relative overflow-hidden">
      {/* Heartbeat scanner line */}
      <div
        className="absolute bottom-0 left-[-20%] h-[1px] w-[40%] opacity-80"
        style={{
          background:
            "linear-gradient(90deg, rgba(204,85,0,0) 0%, rgba(204,85,0,0.8) 50%, rgba(204,85,0,0) 100%)",
          animation: "heartbeat-scan 3s linear infinite",
        }}
      />
      {/* LEFT: IDENTITY LOCK */}
      <div className="border-r border-zinc-800 bg-zinc-950/50 flex items-center gap-3 px-4">
        <div className="h-10 w-10 flex items-center justify-center text-[var(--burnt-orange)]">
          <Shield className="w-8 h-8" />
        </div>
        <div className="leading-tight">
          <div
            className={`text-2xl font-black italic tracking-tighter text-white ${
              flicker ? "animate-[flicker_0.5s_linear_infinite]" : ""
            }`}
          >
            NOMAD NEXUS
          </div>
          <div className="text-[9px] text-zinc-600">V.2955.12.03</div>
        </div>
      </div>

      {/* CENTER: TELEMETRY STREAM */}
      <div className="flex items-center justify-center gap-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black">
        <HUDItem label="DEFCON" value={<span className="text-emerald-400 font-bold">5</span>} />
        <Divider />
        <HUDItem label="THREAT" value="NEGLIGIBLE" />
        <Divider />
        <HUDItem label="ORG FUNDS" value={<span className="text-amber-400 font-bold">{funds}</span>} />
        <Divider />
        <HUDItem
          label="FUEL"
          value={
            <div className="flex flex-col gap-1">
              <span className="font-bold">98%</span>
              <div className="h-1 w-24 bg-zinc-900 border border-zinc-800">
                <div className="h-full w-[98%] bg-[var(--burnt-orange)]" />
              </div>
            </div>
          }
        />
      </div>

      {/* RIGHT: ENVIRONMENTAL SENSORS */}
      <div className="border-l border-zinc-800 bg-zinc-950/50 flex flex-col items-end justify-center px-6 gap-2">
        <div className="font-mono text-lg text-[var(--burnt-orange)] tracking-[0.3em]">
          {clockParts[0]}
          <span className="animate-pulse">:</span>
          {clockParts[1]}
          <span className="animate-pulse">:</span>
          {clockParts[2]}:{clockParts[3]}
        </div>
        <div className="flex items-end gap-1 text-[10px] text-emerald-300">
          <div className="flex items-end gap-1">
            {bars.map((h, idx) => (
              <div
                key={idx}
                style={{ height: `${h}px` }}
                className="w-[4px] bg-emerald-400"
              />
            ))}
          </div>
          <span className="ml-2 text-zinc-400">UPLINK STABLE</span>
        </div>
      </div>
    </div>
  );
}

function HUDItem({ label, value }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-[9px] uppercase text-zinc-500 tracking-[0.24em]">{label}</span>
      <div className="text-sm font-mono text-zinc-200">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-zinc-800" />;
}
