import React, { useEffect, useMemo, useState } from 'react';
import SkillChip from './SkillChip';
import { useMyCertifications, useRequestInstruction, useSkills } from '@/hooks/useAcademy';
import { supabase } from '@/lib/supabase';

const TrainingDeck: React.FC = () => {
  const { skills, loading, error } = useSkills();
  const { requestInstruction, loading: isRequesting, error: requestError } = useRequestInstruction();
  const [cadetId, setCadetId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { certifications } = useMyCertifications(cadetId || undefined);

  const playDataUploadFx = () => {
    // Placeholder SFX hook
    console.log('DATA UPLOAD // TX-12');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!supabase) {
          setStatusBanner('Supabase client missing. Configure credentials.');
          return;
        }
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = data?.user;
        setCadetId(user?.id || null);
        setStatusBanner(user ? null : 'Log in to dispatch instruction requests.');
      } catch (err) {
        console.error('Auth check failed', err);
        setStatusBanner('Unable to verify cadet ID. Check comms link.');
      }
    };
    checkAuth();
  }, []);

  const cursorStyle = useMemo(
    () => ({
      animation: 'blink 1s steps(2, start) infinite',
    }),
    []
  );

  const handleRequest = async (skillId: string) => {
    if (!cadetId) {
      setStatusBanner('Cadet ID missing. Authenticate to proceed.');
      return false;
    }
    playDataUploadFx();
    const result = await requestInstruction(skillId, cadetId);
    if ((result as any)?.error) {
      setStatusBanner('Request failed. Retry or contact ops.');
      return false;
    }
    setStatusBanner('Request dispatched. Awaiting guide assignment.');
    const skillName = (skills || []).find((s) => s.id === skillId)?.name || 'Instruction';
    setToast(`[SIGNAL SENT] Requesting Instructor for ${skillName}...`);
    setTimeout(() => setToast(null), 2600);
    return true;
  };

  const handleInstructorAction = (skillId: string) => {
    const skillName = (skills || []).find((s) => s.id === skillId)?.name || 'Curriculum';
    setToast(`[CURRICULUM] Editing protocols for ${skillName}...`);
    setTimeout(() => setToast(null), 2200);
  };

  const instructorSkillIds = useMemo(() => new Set((certifications || []).map((c) => c.skill_id)), [certifications]);

  return (
    <div className="h-full w-full border border-burnt-orange bg-gunmetal text-tech-white font-mono px-6 py-5 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-amber-300 tracking-[0.25em]">PHASE 5 // NEURAL TRAINING</div>
        <h1 className="text-2xl md:text-3xl font-black tracking-[0.32em] uppercase">
          ACADEMY // TRAINING PROTOCOLS
        </h1>
        <div className="text-[12px] text-tech-white/70 leading-snug max-w-3xl">
          Engage any skill chip to route an instruction request to the Academy grid. No curves, no comfort - just
          signal and response.
        </div>
      </div>

      {statusBanner && (
        <div className="border border-burnt-orange/60 bg-black/50 text-[11px] tracking-[0.2em] px-3 py-2 uppercase flex items-center justify-between">
          <span>{statusBanner}</span>
          {isRequesting && <span className="text-amber-300 animate-pulse">...</span>}
        </div>
      )}

      {requestError && (
        <div className="border border-indicator-red/50 bg-black/60 text-indicator-red text-[11px] tracking-[0.2em] px-3 py-2 uppercase">
          Request channel degraded: {requestError.message}
        </div>
      )}

      <div className="flex-1">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-amber-200 tracking-[0.25em]">
            <div>Loading Schematics...</div>
            <div className="h-5 w-12 bg-amber-500/80" style={cursorStyle} />
          </div>
        )}

        {!loading && error && (
          <div className="h-full flex items-center justify-center text-indicator-red text-sm tracking-[0.25em]">
            Failed to load schematics: {error.message}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[180px]">
            {(skills ?? []).map((skill) => (
              <SkillChip
                key={skill.id}
                skill={skill}
                onRequest={instructorSkillIds.has(skill.id) ? handleInstructorAction : handleRequest}
                mode={instructorSkillIds.has(skill.id) ? 'instructor' : 'request'}
              />
            ))}
            {skills && skills.length === 0 && (
              <div className="col-span-full h-full flex items-center justify-center text-amber-200 tracking-[0.25em]">
                No skill chips configured // Awaiting upload
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-black text-indicator-green border border-indicator-green px-4 py-3 text-[11px] uppercase tracking-[0.18em] shadow-[0_0_12px_rgba(0,255,65,0.35)]">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TrainingDeck;
