import React, { useMemo, useState } from 'react';
import { Skill } from '@/types/database.types';

type SkillChipProps = {
  skill: Skill;
  onRequest: (id: string) => Promise<boolean | void> | boolean | void;
  mode?: 'request' | 'instructor';
};

const HEX_CLIP_PATH = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

const SkillChip: React.FC<SkillChipProps> = ({ skill, onRequest, mode = 'request' }) => {
  const [state, setState] = useState<'idle' | 'requesting' | 'requested'>('idle');
  const [locked, setLocked] = useState<boolean>(false);

  const statusLabel = useMemo(() => {
    if (mode === 'instructor') return 'EDIT CURRICULUM';
    if (state === 'requesting') return 'SENDING PING...';
    if (state === 'requested') return 'REQUEST DISPATCHED';
    return 'REQUEST INSTRUCTION';
  }, [state, mode]);

  const handleRequest = async () => {
    if (locked) return;
    if (mode === 'instructor') {
      onRequest(skill.id);
      return;
    }

    setLocked(true);
    setState('requested'); // optimistic: flash green immediately
    try {
      const result = await onRequest(skill.id);
      if (result === false || (result as any)?.error) {
        setState('idle');
        return;
      }
      setTimeout(() => setState('idle'), 1800);
    } catch {
      setState('idle');
    } finally {
      setLocked(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRequest}
      className={`relative isolate w-full h-full text-left overflow-hidden border border-burnt-orange/80 bg-black/50 text-tech-white uppercase tracking-[0.15em] font-mono opacity-80 transition transform ${
        state === 'requested'
          ? 'shadow-[0_0_18px_rgba(0,255,65,0.65)] animate-pulse'
          : 'hover:shadow-[0_0_18px_rgba(204,85,0,0.75)]'
      } ${locked ? 'cursor-wait' : 'cursor-pointer'} hover:opacity-100 hover:scale-[1.05] focus:outline-none`}
      style={{ clipPath: HEX_CLIP_PATH }}
      disabled={locked}
    >
      <div className="absolute inset-0 border border-burnt-orange/50 pointer-events-none" />

      <div className="relative h-full p-4 flex flex-col gap-2">
        <div className="text-[10px] text-amber-300">{skill.category || 'UNSPECIFIED'}</div>
        <div className="text-lg font-black leading-tight text-tech-white">{skill.name}</div>
        <div className="text-[11px] text-tech-white/70 leading-snug min-h-[2.5rem]">
          {skill.description || 'Awaiting briefing from command.'}
        </div>
        <div className="mt-auto flex items-center justify-between text-[10px]">
          <span
            className={`tracking-[0.2em] ${
              state === 'requested' ? 'text-indicator-green' : 'text-amber-200'
            }`}
          >
            {statusLabel}
          </span>
          <span className="text-burnt-orange font-black">↗</span>
        </div>
      </div>

      {state === 'requested' && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,255,65,0.12), rgba(0,255,65,0.32), rgba(0,255,65,0.12))',
          }}
        />
      )}
    </button>
  );
};

export default SkillChip;
