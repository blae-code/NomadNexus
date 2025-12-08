import React, { useMemo, useState, useEffect } from 'react';
import { CheckSquare, Activity, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useLiveKit } from '@/hooks/useLiveKit';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { hasMinRank } from '@/components/permissions';

const statusColors = {
  idle: 'text-tech-white',
  pending: 'text-amber-300',
  routing: 'text-amber-200',
  linked: 'text-indicator-green',
};

const TrainingDeck = ({ user }) => {
  const { publishData, dataFeed } = useLiveKit();
  const [requests, setRequests] = useState({});
  const [activeSession, setActiveSession] = useState(null);
  const [objectiveState, setObjectiveState] = useState({});

  // Fetch skills from database
  const { data: skillChips = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['training-skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('category', { ascending: true });
      if (error) {
        console.error('Failed to fetch skills:', error);
        return [];
      }
      return (data || []).map(skill => ({
        id: skill.id,
        label: skill.name,
        track: skill.category,
        requires: 'scout', // Default minimum rank
      }));
    },
  });

  // Fetch training objectives for each skill from database
  const { data: objectivesBySkill = {} } = useQuery({
    queryKey: ['training-objectives', skillChips.map(s => s.id).join(',')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_objectives')
        .select('*');
      if (error) {
        console.error('Failed to fetch objectives:', error);
        return {};
      }
      // Group objectives by skill_id
      return (data || []).reduce((acc, obj) => {
        if (!acc[obj.skill_id]) acc[obj.skill_id] = [];
        acc[obj.skill_id].push(obj.description || obj.text);
        return acc;
      }, {});
    },
    enabled: skillChips.length > 0,
  });

  const userRank = useMemo(() => user?.rank?.toLowerCase?.() || 'vagrant', [user]);

  const toggleObjective = (skillId, idx) => {
    setObjectiveState(prev => {
      const next = { ...(prev[skillId] || {}) };
      next[idx] = !next[idx];
      return { ...prev, [skillId]: next };
    });
  };

  const requestInstruction = (skill) => {
    setRequests(prev => ({ ...prev, [skill.id]: 'pending' }));
    setTimeout(() => {
      setRequests(prev => ({ ...prev, [skill.id]: 'routing' }));
      setTimeout(() => {
        publishData({ type: 'TRAINING_REQUEST', skill: skill.id, track: skill.track, ts: Date.now() });
        setRequests(prev => ({ ...prev, [skill.id]: 'linked' }));
        setActiveSession({
          skill,
          instructor: skill.track === 'Industry' ? 'Voyager Lysa' : 'Ranger Holt',
          objectives: objectivesBySkill[skill.id] || [],
        });
      }, 900);
    }, 500);
  };

  useEffect(() => {
    const reqs = dataFeed.filter(d => d.type === 'TRAINING_REQUEST');
    if (reqs.length === 0) return;
    const latest = reqs[reqs.length - 1];
    const skill = skillChips.find(s => s.id === latest.skill);
    if (!skill) return;
    setRequests(prev => ({ ...prev, [skill.id]: 'linked' }));
    setActiveSession({
      skill,
      instructor: `Auto-Link ${skill.track}`,
      objectives: objectivesBySkill[skill.id] || [],
    });
  }, [dataFeed]);

  return (
    <div className="h-full w-full border border-burnt-orange bg-gunmetal grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-tech-white/70 uppercase tracking-[0.3em]">The Training Deck</div>
            <div className="text-lg font-black text-tech-white">Skill Chips // Request Instruction</div>
          </div>
          <div className="text-[11px] font-mono text-amber-300">Your rank: {userRank}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {skillsLoading ? (
            <div className="col-span-2 flex items-center justify-center py-8 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading skills...
            </div>
          ) : skillChips.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-zinc-500 text-sm">
              No training skills available
            </div>
          ) : (
            skillChips.map((skill) => {
              const status = requests[skill.id] || 'idle';
              // Use real permission system to check if user can access training
              const canAccess = hasMinRank(user, skill.requires || 'vagrant');
              return (
                <div
                  key={skill.id}
                  className={`border p-3 flex flex-col gap-1 ${canAccess ? 'border-burnt-orange bg-black/40 cursor-pointer hover:bg-burnt-orange/10' : 'border-zinc-800 bg-black/20 opacity-50 cursor-not-allowed'}`}
                  onClick={() => canAccess && requestInstruction(skill)}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-tech-white">
                    <span>{skill.label}</span>
                    <span className={`px-2 py-1 border text-amber-200 ${canAccess ? 'border-burnt-orange' : 'border-zinc-800'}`}>{skill.track}</span>
                  </div>
                  <div className="text-[10px] text-tech-white/60 font-mono">Requires: {skill.requires}</div>
                  {!canAccess && (
                    <div className="text-[10px] text-red-400 font-mono">RANK INSUFFICIENT</div>
                  )}
                  {canAccess && (
                    <div className={`text-[11px] font-black ${statusColors[status] || statusColors.idle}`}>
                      {status === 'idle' && 'READY'}
                      {status === 'pending' && 'PINGING INSTRUCTORS...'}
                      {status === 'routing' && 'ROUTING // SUB-SPACE'}
                      {status === 'linked' && 'NEURAL LINK ESTABLISHED'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border border-burnt-orange bg-black/60 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-tech-white/70 uppercase tracking-[0.25em]">Neural Link</div>
          <div className="flex items-center gap-2 text-amber-200 font-mono text-[11px]">
            <Activity className="w-4 h-4" />
            {activeSession ? 'SESSION ACTIVE' : 'STANDBY'}
          </div>
        </div>

        {activeSession ? (
          <>
            <div className="text-tech-white font-bold text-sm">
              {activeSession.skill.label} with {activeSession.instructor}
            </div>
            <div className="text-[11px] text-amber-200 font-mono">Objectives</div>
            <div className="space-y-2">
              {(objectivesBySkill[activeSession.skill.id] || []).map((obj, idx) => {
                const checked = objectiveState[activeSession.skill.id]?.[idx];
                return (
                  <label key={idx} className="flex items-center gap-2 text-tech-white text-sm">
                    <input
                      type="checkbox"
                      checked={checked || false}
                      onChange={() => toggleObjective(activeSession.skill.id, idx)}
                      className="appearance-none w-4 h-4 border border-burnt-orange bg-black checked:bg-burnt-orange"
                    />
                    <span className={checked ? 'line-through text-tech-white/50' : ''}>{obj}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-auto flex items-center gap-2 text-amber-200 font-mono text-[11px]">
              <AlertTriangle className="w-4 h-4" />
              PTT to talk. Riggsy records progress for XP/Reputation.
            </div>
          </>
        ) : (
          <div className="flex-1 border border-burnt-orange/50 bg-black/60 flex flex-col items-center justify-center text-center p-4">
            <CheckSquare className="w-8 h-8 text-amber-300 mb-2" />
            <div className="text-tech-white text-sm font-bold">No session active</div>
            <div className="text-[11px] font-mono text-tech-white/70 mt-1">Request Instruction to spin up a Sim-Pod.</div>
          </div>
        )}

        <div className="border-t border-burnt-orange/40 pt-2 text-[11px] font-mono text-tech-white/70 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-burnt-orange" />
          Routing pings to certified instructors only. Pocket MFD will receive push if away.
        </div>
      </div>
    </div>
  );
};

export default TrainingDeck;
