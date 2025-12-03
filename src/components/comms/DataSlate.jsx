import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveKit } from '@/hooks/useLiveKit';
import { supabaseApi } from '@/lib/supabaseApi';
import { supabase, hasSupabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import QuantumSpooler from '../ui/QuantumSpooler';
import HoloThumbnail from './HoloThumbnail';

const terminalLines = [
  "SYSTEM BOOT INITIATED...",
  "LOADING COMMS PROTOCOLS...",
  "ESTABLISHING SECURE LINK: BONFIRE-01...",
  "FIREWALL ONLINE. ALL CHANNELS MONITORED.",
  "RIGGSY: 'Alright, let's get this show on the road. Don't touch anything without my say-so.'",
  "USER_01 JOINED BONFIRE-01.",
  "USER_02 JOINED BONFIRE-01.",
  { type: 'image', src: 'https://via.placeholder.com/150', alt: 'Tactical Map Excerpt' },
  "DATA SLATE ACTIVE. AWAITING INPUT.",
];

const hudTabs = [
  { id: 'map', label: 'Map Ping', voiceHint: 'Say "expand map intel"' },
  { id: 'roster', label: 'Squad Stack', voiceHint: 'Say "open roster"' },
  { id: 'intel', label: 'Pinned Intel', voiceHint: 'Say "pin this"' },
];

const intelGallery = [
  { id: 'stc-7', name: 'Sector C-7 Drift', src: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80' },
  { id: 'dock', name: 'Dock 12 Manifest', src: 'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=600&q=80' },
  { id: 'ridge', name: 'Ridge Line IR', src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80' },
];

const roster = [
  { name: 'Vega', role: 'Lead', status: 'Online' },
  { name: 'Mara', role: 'Recon', status: 'Shadow' },
  { name: 'Hex', role: 'EWAR', status: 'Jamming' },
];

const DataSlate = ({ isListening = false }) => {
  const { publishData, dataFeed } = useLiveKit();
  const [campfireId, setCampfireId] = useState('BONFIRE-01');
  const [log, setLog] = useState([]);
  const [input, setInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [activeHudTab, setActiveHudTab] = useState('map');
  const [expandedIntel, setExpandedIntel] = useState(null);

  // Simulate LiveKit Data Packet reception
  useEffect(() => {
    const livekitMessageInterval = setInterval(() => {
      const simulatedMessages = [
        "LIVEKIT: User_3 reports: 'Found some anomalies in Sector C-7.'",
        "LIVEKIT: User_4: 'Acknowledged, moving to assist.'",
        "LIVEKIT: User_1: 'Copy that, staying alert.'",
      ];
      const randomMessage = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];
      setLog((prev) => [...prev, randomMessage]);
    }, 15000); // Simulate a message every 15 seconds

    return () => clearInterval(livekitMessageInterval);
  }, []);


  useEffect(() => {
    // Simulate loading initial messages, eventually replace with Supabase fetch
    // const fetchMessages = async () => {
    //   const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    //   if (data) {
    //     setLog(data.map(msg => msg.content));
    //   } else {
    //     console.error('Error fetching messages:', error);
    //   }
    // };
    // fetchMessages();

    let i = 0;
    const interval = setInterval(() => {
      if (i < terminalLines.length) {
        setLog((prev) => [...prev, terminalLines[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 500); // Simulate typing speed

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(cursorInterval);
    };
  }, []);

  useEffect(() => {
    const chatPackets = dataFeed.filter(msg => msg.type === 'CHAT');
    if (chatPackets.length > 0) {
      const lines = chatPackets.map(msg => msg.content || '');
      setLog((prev) => [...prev, ...lines]);
    }
  }, [dataFeed]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        if (hasSupabase) {
          const { data, error } = await supabase
            .from('messages')
            .select('content')
            .eq('campfire_id', campfireId)
            .order('created_at', { ascending: true })
            .limit(50);
          if (!error && data) {
            setLog(data.map((row) => row.content));
          }
        } else {
          const rows = await supabaseApi.entities.Message.list({
            filter: { campfire_id: campfireId },
            sort: { created_at: 1 },
            limit: 50,
          });
          if (Array.isArray(rows)) {
            setLog(rows.map((row) => row.content));
          }
        }
      } catch (err) {
        console.error('Supabase fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [campfireId]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const newMessage = `> ${input}`;
      const content = attachment ? `${newMessage} [ATTACH:${attachment.name}]` : newMessage;
      setLog((prev) => [...prev, content, `[RIGGSY]: Acknowledged. Broadcasting message.`]);
      publishData({ type: 'CHAT', content, ts: Date.now(), attachment: attachment?.name });
      if (hasSupabase) {
        supabase
          .from('messages')
          .insert({ campfire_id: campfireId, content, attachments: attachment ? [{ name: attachment.name }] : [] })
          .catch((err) => console.error('Supabase insert failed', err));
      } else {
        supabaseApi.entities.Message.create({
          campfire_id: campfireId,
          content,
          attachments: attachment ? [{ name: attachment.name }] : [],
        }).catch((err) => console.error('Supabase insert failed', err));
      }
      setInput('');
      setAttachment(null);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gunmetal border-l border-burnt-orange text-tech-white font-mono text-xs">
      <div className={`shrink-0 border-b border-burnt-orange/70 bg-black/40 px-3 py-2 flex items-center justify-between ${isListening ? 'shadow-[0_0_0_1px_rgba(234,88,12,0.3)]' : ''}`}>
        <div className="flex items-center gap-2 uppercase tracking-[0.2em] text-[11px]">
          <span className="text-amber-300">DataSlate</span>
          <span className="text-tech-white/60">Mission HUD Stack</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-amber-200">
          <span className="px-2 py-1 border border-burnt-orange/60 bg-burnt-orange/10">Say "open campfire chat"</span>
          {isListening && <span className="px-2 py-1 bg-amber-500/20 border border-amber-400/60">Listening...</span>}
        </div>
      </div>

      <div className="shrink-0 border-b border-burnt-orange/50 bg-black/30 px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          {hudTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveHudTab(tab.id)}
              className={`px-3 py-1 border text-[11px] uppercase tracking-[0.15em] ${activeHudTab === tab.id ? 'border-burnt-orange bg-burnt-orange/10 text-amber-200' : 'border-zinc-700 text-tech-white/70 hover:border-burnt-orange/60'}`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto text-[10px] text-amber-300">{hudTabs.find((t) => t.id === activeHudTab)?.voiceHint}</div>
        </div>

        {activeHudTab === 'map' && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`border px-3 py-2 bg-gradient-to-br from-black via-black/80 to-burnt-orange/10 ${isListening ? 'border-burnt-orange' : 'border-zinc-700'}`}>
              <div className="text-[10px] text-amber-300 mb-1 uppercase">Waypoint Ribbon</div>
              <p className="text-tech-white/80">Stanton AO projected. Say "mark waypoint" to highlight your cursor sector.</p>
              <div className="mt-2 h-16 bg-[radial-gradient(circle_at_20%_20%,rgba(234,88,12,0.5),transparent),radial-gradient(circle_at_80%_60%,rgba(64,196,255,0.4),transparent)] border border-burnt-orange/50" />
            </div>
            <div className="border border-zinc-700 px-3 py-2 bg-black/60">
              <div className="text-[10px] text-amber-300 mb-1 uppercase">Callsign Pulse</div>
              <p className="text-tech-white/80">Holo overlay routes commands to map and comms simultaneously when PTT is held.</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-tech-white/70">
                <span className="px-2 py-1 border border-amber-500/50 bg-amber-500/10">ALT held</span>
                <span className="px-2 py-1 border border-burnt-orange/50 bg-burnt-orange/10">Routes: Map + Chat</span>
              </div>
            </div>
          </div>
        )}

        {activeHudTab === 'roster' && (
          <div className="grid grid-cols-3 gap-2">
            {roster.map((member) => (
              <div key={member.name} className={`border px-2 py-2 bg-black/60 ${isListening ? 'border-burnt-orange' : 'border-zinc-700'}`}>
                <div className="text-tech-white text-[12px]">{member.name}</div>
                <div className="text-[10px] text-amber-300 uppercase">{member.role}</div>
                <div className="text-[10px] text-tech-white/60">Status: {member.status}</div>
              </div>
            ))}
          </div>
        )}

        {activeHudTab === 'intel' && (
          <div className="grid grid-cols-3 gap-2">
            {intelGallery.map((intel) => (
              <button
                key={intel.id}
                onClick={() => setExpandedIntel(intel)}
                className={`group border overflow-hidden relative ${isListening ? 'border-burnt-orange' : 'border-zinc-700'}`}
              >
                <img src={intel.src} alt={intel.name} className="h-20 w-full object-cover filter grayscale group-hover:filter-none transition" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-1 left-1 text-[10px] text-amber-200">{intel.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {expandedIntel && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40" onClick={() => setExpandedIntel(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-black border border-burnt-orange p-4 max-w-md w-full">
            <div className="text-[12px] text-amber-200 mb-2">{expandedIntel.name}</div>
            <img src={expandedIntel.src} alt={expandedIntel.name} className="w-full h-64 object-cover" />
            <p className="text-[11px] text-tech-white/80 mt-2">Say "collapse intel" or tap to close.</p>
          </motion.div>
        </div>
      )}

      <div className="flex-1 p-2 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
            <QuantumSpooler label="SYNCING COMMS" />
          </div>
        )}
        <ScrollArea className="h-full pr-2 relative scanline-overlay">
          {log.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="py-0.5"
            >
              {typeof line === 'string' ? (
                <p className="font-mono text-[12px] leading-6 text-emerald-100/90 tracking-tight drop-shadow-[0_0_6px_rgba(0,255,65,0.18)]">
                  {line}
                </p>
              ) : (
                <HoloThumbnail src={line.src} alt={line.alt} tint="amber" />
              )}
            </motion.div>
          ))}
        </ScrollArea>
      </div>
      <form onSubmit={handleSendMessage} className={`shrink-0 p-2 border-t border-burnt-orange flex items-center gap-2 ${isListening ? 'shadow-[0_-2px_12px_rgba(234,88,12,0.2)]' : ''}`}>
        <span className="text-burnt-orange mr-1">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="flex-1 bg-transparent outline-none text-tech-white text-xs"
          placeholder={isListening ? 'PTT active: speak or type...' : 'Type comms...'}
        />
        {showCursor && <span className="text-tech-white animate-pulse">_</span>}
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          className="w-32 text-[10px] bg-black border border-burnt-orange text-tech-white"
        />
        <button type="submit" className="ml-2 px-2 py-1 bg-burnt-orange text-gunmetal font-bold text-xs">
          SEND
        </button>
      </form>
    </div>
  );
};

export default DataSlate;
