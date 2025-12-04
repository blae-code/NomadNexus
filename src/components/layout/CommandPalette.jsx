import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPageUrl } from "@/utils";
import {
  Search,
  Command,
  Globe,
  Shield,
  Activity,
  Terminal,
  Zap,
  Users,
  LayoutGrid,
  Radio,
  Rocket,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("SEARCH"); // SEARCH | COMMAND
  const [commandToken, setCommandToken] = useState(null);
  const [commandParam, setCommandParam] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const measureRef = useRef(null);
  const chipRef = useRef(null);
  const containerRef = useRef(null);
  const [signalBars, setSignalBars] = useState([6, 12, 9, 14, 10]);

  const baseResults = useMemo(() => ([
    { 
      category: "> NAVIGATION",
      items: [
        { icon: LayoutGrid, label: "Dashboard", shortcut: "D", action: () => window.location.href = createPageUrl('NomadOpsDashboard') },
        { icon: Radio, label: "Comms Console", shortcut: "C", action: () => window.location.href = createPageUrl('CommsConsole') },
        { icon: Rocket, label: "Fleet Manager", shortcut: "F", action: () => window.location.href = createPageUrl('FleetManager') },
        { icon: Shield, label: "Admin Panel", shortcut: "A", action: () => window.location.href = createPageUrl('Admin') },
        { icon: Users, label: "Personnel", shortcut: "P", action: () => window.location.href = createPageUrl('Channels') },
      ]
    },
    {
      category: "> OPERATIVES",
      items: [
        { icon: Users, label: "Invite Operator", sub: "Use /invite", action: () => console.log("Invite flow") },
        { icon: Users, label: "Search Roster", sub: "Live", action: () => console.log("Search roster") },
      ]
    },
    {
      category: "> FLEET ASSETS",
      items: [
        { icon: Rocket, label: "Deploy Hammerhead", sub: "Wing Alpha", action: () => console.log("Deploy ship") },
        { icon: Rocket, label: "Deploy Starfarer", sub: "Refuel Ops", action: () => console.log("Deploy fuel") },
      ]
    },
    {
      category: "> ACTIONS",
      items: [
        { icon: Zap, label: "Emergency Broadcast", sub: "Global Alert", action: () => console.log("Trigger Alert") },
        { icon: Activity, label: "Network Diagnostics", sub: "Run Test", action: () => console.log("Run Diag") },
        { icon: Globe, label: "Sector Scan", sub: "Tactical Map", action: () => console.log("Scan") },
      ]
    }
  ]), []);

  const deriveTerm = (raw) => {
    if (!raw.startsWith("/")) return { mode: "SEARCH", token: null, param: raw.trim() };
    const parts = raw.slice(1).trim().split(/\s+/);
    const token = parts[0] || "";
    const param = parts.slice(1).join(" ").trim();
    return { mode: "COMMAND", token, param };
  };

  const filterResults = (term, token) => {
    if (term === "" && !token) return baseResults;
    const lower = term.toLowerCase();
    const targetCategory = token === "invite" ? "> OPERATIVES" : token === "deploy" ? "> FLEET ASSETS" : token === "alert" ? "> ACTIONS" : null;

    return baseResults
      .filter(group => !targetCategory || group.category === targetCategory)
      .map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.label.toLowerCase().includes(lower) ||
          (item.sub && item.sub.toLowerCase().includes(lower))
        )
      }))
      .filter(group => group.items.length > 0);
  };

  useEffect(() => {
    const { mode: nextMode, token, param } = deriveTerm(query);
    setMode(nextMode);
    setCommandToken(token || null);
    setCommandParam(param);

    setIsLoading(true);
    const handle = setTimeout(() => {
      const termForSearch = nextMode === "COMMAND" ? param : query;
      const results = filterResults(termForSearch, token);
      setSearchResults(results);
      setSelectedIndex(0);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, baseResults]);

  const filteredCommands = searchResults.length ? searchResults : baseResults;
  const flatItems = filteredCommands.flatMap(g => g.items);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (isOpen) {
        if (!flatItems.length) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % flatItems.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          const item = flatItems[selectedIndex];
          if (item) {
            item.action();
            setIsOpen(false);
            setQuery("");
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Visual Logic
  const messages = [
    "> AWAITING COMMAND...",
    "> CONNECTING TO NEURAL LINK...",
    "> ENTER TACTICAL QUERY...",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState(messages[0]);
  useEffect(() => {
    let char = 0;
    let active = true;
    const typeNext = () => {
      if (!active) return;
      const msg = messages[placeholderIndex];
      if (char <= msg.length) {
        setTypedPlaceholder(msg.slice(0, char));
        char += 1;
        setTimeout(typeNext, 70);
      } else {
        setTimeout(() => {
          if (!active) return;
          setPlaceholderIndex((prev) => (prev + 1) % messages.length);
          char = 0;
          typeNext();
        }, 1200);
      }
    };
    typeNext();
    return () => {
      active = false;
    };
  }, [placeholderIndex]);

  // Signal bars fluctuation
  useEffect(() => {
    const id = setInterval(() => {
      setSignalBars((prev) =>
        prev.map(() => 6 + Math.floor(Math.random() * 10))
      );
    }, 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl z-50">
      {/* Main Input Bar */}
      <div className="relative group transition-colors duration-200">
        {/* Reticle / Scanline Wrapper */}
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-30"
        />
        {/* Animated Glow Background */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-[#cc5500]/0 via-[#cc5500]/25 to-[#cc5500]/0 blur-lg transition-opacity duration-300",
            isOpen || isFocused ? "opacity-80" : "opacity-10 group-hover:opacity-35"
          )}
        />

        {/* Reticle Corners */}
        {["tl", "tr", "bl", "br"].map((pos) => (
          <div
            key={pos}
            className={cn(
              "absolute w-4 h-4 border-[1.5px] border-[var(--burnt-orange)] transition-transform duration-200",
              pos === "tl" && "top-0 left-0 border-r-0 border-b-0",
              pos === "tr" && "top-0 right-0 border-l-0 border-b-0",
              pos === "bl" && "bottom-0 left-0 border-r-0 border-t-0",
              pos === "br" && "bottom-0 right-0 border-l-0 border-t-0",
              isFocused ? "scale-125" : "scale-100"
            )}
          />
        ))}

        <div
          className={cn(
            "relative flex items-center h-12 bg-zinc-950/90 backdrop-blur-md border transition-all duration-300 overflow-hidden",
            isOpen || isFocused
              ? "border-[var(--burnt-orange)] shadow-[0_0_30px_rgba(204,85,0,0.2)]"
              : "border-zinc-800 hover:border-zinc-600"
          )}
        >
          {/* Hidden text to measure caret width */}
          <span
            ref={measureRef}
            className="absolute invisible whitespace-pre font-mono text-xs uppercase tracking-widest px-0"
          >
            {query || typedPlaceholder}
          </span>

          {/* Search Icon / Spinner */}
          <div className="pl-4 pr-3 text-zinc-500 group-hover:text-[var(--burnt-orange)] transition-colors">
            {isOpen || isFocused ? (
              <Terminal className="w-4 h-4 animate-pulse text-[var(--burnt-orange)]" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          {/* Input Field */}
          {mode === "COMMAND" && (
            <div
              ref={chipRef}
              className="ml-2 mr-2 px-2 py-1 text-[10px] font-black tracking-[0.2em] uppercase border border-[var(--burnt-orange)] text-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10 flex items-center gap-1 shrink-0"
            >
              COMMAND:
              <span className="text-white">{commandToken || "UNKNOWN"}</span>
            </div>
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => {
              setIsOpen(true);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            className="flex-1 h-full bg-transparent border-none text-base font-mono font-semibold text-[var(--burnt-orange)] focus:ring-0 focus:outline-none uppercase tracking-[0.18em] caret-transparent selection:bg-[var(--burnt-orange)]/25 placeholder:text-[var(--burnt-orange)]/55"
            placeholder={typedPlaceholder}
            spellCheck={false}
            autoComplete="off"
            style={{
              textShadow: "0 0 10px rgba(204, 85, 0, 0.25)",
            }}
          />

          {/* Custom Caret */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-5 bg-[var(--burnt-orange)] animate-pulse"
            style={{
              left: `${(measureRef.current?.offsetWidth || 0) + 56 + (chipRef.current?.offsetWidth || 0)}px`,
            }}
          />

          {/* Right-side signal + shortcut */}
          <div className="pr-3 flex items-center gap-3">
            <div className="flex gap-0.5 items-end">
              {signalBars.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className={cn(
                    "w-1 bg-[var(--burnt-orange)] transition-all duration-300",
                    i === signalBars.length - 1 ? "opacity-90" : "opacity-70"
                  )}
                />
              ))}
            </div>
            {!isOpen && !isFocused && (
              <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl overflow-hidden z-50"
          >
            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10 opacity-20" />

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 relative z-20">
               {isLoading ? (
                 <div className="p-6 flex items-center gap-3 text-[11px] text-zinc-500 font-mono uppercase tracking-[0.2em]">
                   <Activity className="w-4 h-4 animate-spin text-[var(--burnt-orange)]" />
                   SEARCHING DATABASE...
                 </div>
               ) : flatItems.length === 0 ? (
                 <div className="p-8 text-center text-zinc-600 font-mono text-xs">
                   <div className="mb-2">NO MATCHING PROTOCOLS FOUND</div>
                   <div className="text-[10px] opacity-50">TRY A DIFFERENT QUERY</div>
                </div>
              ) : (
                filteredCommands.map((group, gIdx) => (
                   <div key={gIdx} className="mb-3 last:mb-0">
                     <div className="px-2 py-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] font-mono">
                       {group.category}
                     </div>
                     <div className="space-y-0.5">
                       {group.items.map((item, idx) => {
                         const globalIndex = flatItems.indexOf(item);
                         const isSelected = globalIndex === selectedIndex;
                         
                         return (
                           <button
                             key={idx}
                             onClick={() => {
                               item.action();
                               setIsOpen(false);
                             }}
                             onMouseEnter={() => setSelectedIndex(globalIndex)}
                             className={cn(
                               "w-full flex items-center gap-3 pl-6 pr-3 py-2.5 text-left transition-all duration-100 relative group border border-transparent",
                               isSelected 
                                 ? "bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/70 shadow-[0_0_15px_rgba(234,88,12,0.15)]" 
                                 : "text-zinc-400 hover:bg-zinc-900/50"
                             )}
                           >
                             {isSelected && (
                               <>
                                 <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#ea580c] shadow-[0_0_10px_rgba(234,88,12,0.8)]" />
                                 <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#ea580c]">{">>"}</div>
                               </>
                             )}
                             
                             <item.icon className={cn(
                               "w-4 h-4",
                               isSelected ? "text-[#ea580c]" : "text-zinc-600"
                             )} />
                             
                             <div className="flex-1">
                               <div className={cn(
                                 "text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2",
                                 isSelected ? "text-white" : "text-zinc-300"
                               )}>
                                 {item.label}
                                 {item.sub && (
                                   <span className="text-[9px] px-1.5 py-0.5 bg-zinc-900 text-zinc-500 border border-zinc-800">
                                     {item.sub}
                                   </span>
                                 )}
                               </div>
                             </div>

                             {item.shortcut && !isSelected && (
                               <span className="text-[9px] font-mono text-zinc-700 border border-zinc-800 px-1.5 py-0.5 bg-zinc-900/50">
                                 {item.shortcut}
                               </span>
                             )}
                           </button>
                         );
                       })}
                     </div>
                   </div>
                 ))
               )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-[9px] text-zinc-600 font-mono uppercase">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-zinc-800 rounded flex items-center justify-center text-[8px]">↵</span> SELECT</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-zinc-800 rounded flex items-center justify-center text-[8px]">↑↓</span> NAVIGATE</span>
              </div>
              <div>SYSTEM READY</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
