import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveKit } from '@/hooks/useLiveKit';
import { base44 } from '@/api/base44Client';
import { supabase, hasSupabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';

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

const DataSlate = () => {
  const { publishData, dataFeed } = useLiveKit();
  const [campfireId, setCampfireId] = useState('BONFIRE-01');
  const [log, setLog] = useState([]);
  const [input, setInput] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);

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
          const rows = await base44.entities.Message.list({
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
        base44.entities.Message.create({
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
      <div className="flex-1 p-2 overflow-hidden">
        <ScrollArea className="h-full pr-2">
          {log.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="py-0.5"
            >
              {typeof line === 'string' ? (
                <p>{line}</p>
              ) : (
                <motion.div
                  className="inline-block relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={line.src}
                    alt={line.alt}
                    className="w-24 h-24 object-cover filter grayscale sepia hue-rotate-180 saturate-200 brightness-80 transition-all duration-300 hover:filter-none"
                  />
                  <div className="absolute inset-0 border border-burnt-orange pointer-events-none" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </ScrollArea>
      </div>
      <form onSubmit={handleSendMessage} className="shrink-0 p-2 border-t border-burnt-orange flex items-center gap-2">
        <span className="text-burnt-orange mr-1">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="flex-1 bg-transparent outline-none text-tech-white text-xs"
          placeholder="Type comms..."
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
