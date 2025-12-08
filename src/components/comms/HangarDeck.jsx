import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import ShipVoice from '@/api/ShipVoice';
import { useLiveKit } from '@/hooks/useLiveKit';
import { Loader2 } from 'lucide-react';

const doctrineColors = {
  Rescue: 'border-amber-500 text-amber-200',
  Defense: 'border-burnt-orange text-burnt-orange',
  Industry: 'border-teal-500 text-teal-200',
};

const requirementLabels = {
  MEDICAL_CERT: 'Medical Certification',
  NAV_CERT: 'Navigation',
  COMBAT_CERT: 'Combat',
  HEAVY_CERT: 'Heavy Pilot',
  RANGER_CERT: 'Ranger Qualification',
  ENGINEERING_CERT: 'Engineering',
};

const SparkToken = ({ user }) => (
  <div className="w-12 h-12 bg-tech-white text-gunmetal font-black flex items-center justify-center shadow-lg clip-path-diamond uppercase text-sm">
    {user?.callsign ? user.callsign.slice(0, 2) : 'SP'}
    <style>{`.clip-path-diamond { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }`}</style>
  </div>
);

const ShipSlot = ({ slot, isHovering, rejected }) => {
  const occupied = slot.occupant_user_id ? true : false;
  const doctrineClass = doctrineColors[slot.doctrine] || 'border-burnt-orange text-tech-white';
  return (
    <motion.div
      className={`relative w-full h-28 border px-3 py-2 flex flex-col justify-between bg-black/40 ${doctrineClass}`}
      animate={rejected ? { x: [-2, 2, -1, 1, 0] } : {}}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between text-xs font-mono text-tech-white">
        <span className="tracking-widest">{slot.name}</span>
        <span className={`px-2 py-1 border ${occupied ? 'border-red-700 text-red-300' : 'border-amber-700 text-amber-300'}`}>
          {occupied ? 'SEALED' : 'OPEN'}
        </span>
      </div>
      <div className="text-[10px] text-tech-white/70 font-mono">
        {slot.requires_cert ? `REQ: ${requirementLabels[slot.requires_cert] || slot.requires_cert}` : 'REQ: NONE'}
      </div>
      <div className="text-xs font-bold text-tech-white">
        {occupied ? `OCCUPIED` : isHovering ? 'ALIGNING HARDPOINT...' : 'READY FOR BOARDING'}
      </div>
      {rejected && (
        <div className="absolute inset-0 bg-red-900/30 border border-[#8a0303] text-[#8a0303] text-center text-xs font-black flex items-center justify-center tracking-[0.25em]">
          REJECTED
        </div>
      )}
    </motion.div>
  );
};

const HangarDeck = ({ user }) => {
    // Fetch hangar slots from database
    const { data: slots = [], isLoading: slotsLoading } = useQuery({
      queryKey: ['hangar-slots'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('hangar_slots')
          .select('*')
          .order('doctrine');
        if (error) {
          console.error('Failed to fetch hangar slots:', error);
          // Return fallback slots if fetch fails
          return [
            { id: 'red-pilot', name: 'Pilot - Cutlass Red', requires_cert: 'MEDICAL_CERT', doctrine: 'Rescue', occupant_user_id: null },
            { id: 'red-copilot', name: 'Co-Pilot - Cutlass Red', requires_cert: 'NAV_CERT', doctrine: 'Rescue', occupant_user_id: null },
            { id: 'red-turret', name: 'Turret - Cutlass Red', requires_cert: 'COMBAT_CERT', doctrine: 'Rescue', occupant_user_id: null },
          ];
        }
        return data || [];
      },
      refetchInterval: 5000,
    });

  const { publishData, dataFeed } = useLiveKit();
  const [hoverSlot, setHoverSlot] = useState(null);
  const [rejectedSlot, setRejectedSlot] = useState(null);
  const [log, setLog] = useState([
    "Hangar Deck primed. Slots loading...",
  ]);
  const riggsyVoice = useRef(null);

  useEffect(() => {
    riggsyVoice.current = new ShipVoice();
    return () => {
      try { window.speechSynthesis.cancel(); } catch (err) {
        console.warn('Speech synthesis cleanup failed', err);
      }
    };
  }, []);

  const userCerts = useMemo(() => {
    if (!user) return [];
    return user.certifications || user.certs || user.roles || [];
  }, [user]);

  const addLog = (entry) => setLog(prev => [entry, ...prev].slice(0, 5));

  const handleDrop = (slotId) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    if (slot.occupant_user_id) {
      addLog(`Riggsy: Slot ${slot.name} already sealed.`);
      riggsyVoice.current?.announce(`Slot ${slot.name} already sealed.`);
      return;
    }
    const hasCert = !slot.requires_cert || userCerts.includes(slot.requires_cert);
    if (!hasCert) {
      setRejectedSlot(slotId);
      addLog(`Riggsy: ${slot.name} rejects. Missing ${requirementLabels[slot.requires_cert] || slot.requires_cert}.`);
      riggsyVoice.current?.announce(`Access denied. ${slot.name} requires ${requirementLabels[slot.requires_cert] || slot.requires_cert}.`, 0.9, 0.9);
      setTimeout(() => setRejectedSlot(null), 800);
      return;
    }
    const occupantName = user?.callsign || user?.rsi_handle || 'YOU';
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, occupied: occupantName } : s));
    publishData({ type: 'HANGAR_CLAIM', slotId, occupant: occupantName, ts: Date.now() });
    addLog(`Riggsy: ${slot.name} locked. ${slot.doctrine} stack reinforced.`);
    if (slot.doctrine === 'Defense') {
      riggsyVoice.current?.announce('Boss, we are light on ballistics no more.', 1, 0.95);
    } else {
      riggsyVoice.current?.announce('Rescue wing standing by.', 1, 0.95);
    }
  };

  useEffect(() => {
    const claims = dataFeed.filter(d => d.type === 'HANGAR_CLAIM');
    if (claims.length === 0) return;
    const latest = claims[claims.length - 1];
    setSlots(prev => prev.map(s => s.id === latest.slotId ? { ...s, occupied: latest.occupant } : s));
    addLog(`Riggsy: ${latest.occupant} sealed ${latest.slotId}.`);
  }, [dataFeed]);

  return (
    <div className="relative w-full h-full bg-gunmetal border border-burnt-orange p-4 overflow-hidden flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-tech-white text-xl font-bold uppercase tracking-[0.25em]">Hangar Deck // Sign-Up</h2>
          <div className="text-[11px] text-amber-200 font-mono">Drag your Spark into a ship slot. Smart Gating enforced.</div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-tech-white">
          <div className="px-2 py-1 border border-burnt-orange bg-black/50">SPARK</div>
          <SparkToken user={user} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {slots.map(slot => (
          <div
            key={slot.id}
            onDragOver={(e) => { e.preventDefault(); setHoverSlot(slot.id); }}
            onDragLeave={() => setHoverSlot(null)}
            onDrop={(e) => { e.preventDefault(); setHoverSlot(null); handleDrop(slot.id); }}
            className="border border-burnt-orange/40 p-1 bg-black/30"
          >
            <ShipSlot slot={slot} isHovering={hoverSlot === slot.id} rejected={rejectedSlot === slot.id} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-3">
        <div className="border border-burnt-orange bg-black/60 p-3 flex flex-col gap-2">
          <div className="text-[11px] font-mono text-amber-200 uppercase tracking-[0.2em]">Spark (Drag Me)</div>
          <div draggable className="w-full border border-burnt-orange bg-burnt-orange/20 flex items-center justify-between px-3 py-2 cursor-move">
            <SparkToken user={user} />
            <div className="text-xs text-tech-white font-bold">Hold & Drop onto Slot</div>
          </div>
          <div className="text-[10px] text-tech-white/70 font-mono leading-relaxed">
            Slots reject if your Service Record is missing the required certification.
          </div>
        </div>
        <div className="border border-burnt-orange bg-black/70 p-3">
          <div className="text-[11px] font-mono text-tech-white uppercase tracking-[0.2em] mb-2">Riggsy Traffic</div>
          <div className="space-y-1 text-[11px] font-mono text-amber-200">
            {log.map((entry, idx) => (
              <div key={idx} className="border-b border-burnt-orange/20 pb-1">{entry}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HangarDeck;
