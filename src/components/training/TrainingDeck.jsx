import React, { useMemo, useState, useEffect } from 'react';
import { CheckSquare, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLiveKit } from '@/hooks/useLiveKit';

const skillChips = [
  { id: 'mining_basics', label: 'mining_basics.chip', track: 'Industry', requires: 'Voyager' },
  { id: 'combat_patrol', label: 'combat_patrol.chip', track: 'Rangers', requires: 'Ranger' },
  { id: 'medevac', label: 'medevac.chip', track: 'Rescue', requires: 'Rescue' },
  { id: 'logi', label: 'logistics.chip', track: 'Support', requires: 'Voyager' },
  { id: 'interdiction', label: 'interdiction.chip', track: 'Rangers', requires: 'Shaman' },
  { id: 'gunnery', label: 'gunnery.chip', track: 'Rangers', requires: 'Scout' },
];

const objectivesBySkill = {
  mining_basics: ['Calibrate scanner', 'Stabilize laser', 'Secure cargo grid'],
  combat_patrol: ['Check armor seals', 'Engage sim target', 'Report heat bleed'],
  medevac: ['Prime medbay', 'Lock patient cot', 'Route triage uplink'],
  logi: ['Manifest supplies', 'Confirm beacon', 'Route flight plan'],
  interdiction: ['Power up snare', 'Broadcast hail', 'Control escalation'],
  gunnery: ['Zero barrels', 'Track target lead', 'Report ammo state'],
};

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

  const userRank = useMemo(() => user?.rank || 'Vagrant', [user]);

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
          {skillChips.map((skill) => {
            const status = requests[skill.id] || 'idle';
            const isLocked = false; // Placeholder for rank gating rules
            return (
              <div
                key={skill.id}
                className="border border-burnt-orange bg-black/40 p-3 flex flex-col gap-1 cursor-pointer hover:bg-burnt-orange/10"
                onClick={() => requestInstruction(skill)}
              >
                <div className="flex items-center justify-between text-xs font-mono text-tech-white">
                  <span>{skill.label}</span>
                  <span className="px-2 py-1 border border-burnt-orange text-amber-200">{skill.track}</span>
                </div>
                <div className="text-[10px] text-tech-white/60 font-mono">Requires: {skill.requires}</div>
                <div className={`text-[11px] font-black ${statusColors[status] || statusColors.idle}`}>
                  {status === 'idle' && 'READY'}
                  {status === 'pending' && 'PINGING INSTRUCTORS...'}
                  {status === 'routing' && 'ROUTING // SUB-SPACE'}
                  {status === 'linked' && 'NEURAL LINK ESTABLISHED'}
                </div>
                {isLocked && <div className="text-[10px] text-red-400 font-mono">LOCKED</div>}
              </div>
            );
          })}
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
              {activeSession.objectives.map((obj, idx) => {
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
