import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const skillChipsData = [
  { id: 'b75f8e5f-1e7a-4c9d-9e6a-1b0a2f7c3d5e', name: 'Mining Basics', description: 'Fundamental techniques for mineral extraction.', certified: false },
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'Combat Flight Maneuvers', description: 'Advanced piloting for engagement scenarios.', certified: true },
  { id: 'c3d5e7f9-2a1b-4c3d-8e7f-1a2b3c4d5e6f', name: 'Field Medical Aid', description: 'Emergency medical procedures for crew.', certified: false },
  { id: 'd2e4f6a8-b1c3-5d7e-9f0a-1b2c3d4e5f6a', name: 'Cargo Hauling Logistics', description: 'Efficient and secure transport of goods.', certified: true },
  { id: 'e1f3a5b7-c9d0-2e4f-6a8b-0c1d2e3f4a5b', name: 'Deep Space Exploration Scans', description: 'Utilizing sensors for anomaly detection.', certified: false },
  { id: 'f0a2b4c6-d8e9-1f2a-3b4c-5d6e7f8a9b0c', name: 'Shipboard Engineering Repair', description: 'Emergency and routine maintenance.', certified: true },
];

const SkillChip = ({ skill, onRequest, isRequesting }) => {
  const chipClasses = skill.certified
    ? 'border-tech-green text-tech-green'
    : 'border-amber-500 text-amber-300';

  return (
    <div className={`relative border p-3 bg-black/40 flex flex-col justify-between ${chipClasses}`}>
      <h3 className="text-sm font-bold uppercase tracking-wider">{skill.name}</h3>
      <p className="text-[10px] font-mono text-tech-white/70 mt-1">{skill.description}</p>
      <button
        className={`mt-2 w-full py-1 text-xs font-mono uppercase tracking-widest border ${skill.certified ? 'border-tech-green bg-tech-green/20 text-tech-green' : 'border-burnt-orange bg-burnt-orange/20 text-burnt-orange'} hover:bg-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => onRequest(skill.id, skill.name)}
        disabled={isRequesting || skill.certified}
      >
        {skill.certified ? 'Certified' : (isRequesting ? 'Requesting...' : 'Request Instruction')}
      </button>
    </div>
  );
};

const TrainingDeck = ({ user }) => { // Added user prop
  const [log, setLog] = useState([]);

  const addLog = (entry) => setLog(prev => [entry, ...prev].slice(0, 5));

  const requestInstructionMutation = useMutation({
    mutationFn: async ({ skillId, cadetId }) => {
      const response = await base44.post('/api/academy/request', { skillId, cadetId });
      return response.data;
    },
    onSuccess: (data, variables) => {
      addLog(`Riggsy: Instruction request for skill ID ${variables.skillId} submitted. Request ID: ${data.requestId}.`);
      toast.success(`Request for ${skillChipsData.find(s => s.id === variables.skillId)?.name || 'instruction'} sent!`);
    },
    onError: (error, variables) => {
      addLog(`Riggsy: Error submitting request for skill ID ${variables.skillId}. Error: ${error.message}`);
      toast.error(`Failed to request instruction: ${error.message}`);
    },
  });

  const handleRequestInstruction = (skillId, skillName) => {
    if (!user || !user.id) {
      addLog("Riggsy: Cadet ID not found. Login required.");
      toast.error("You must be logged in to request instruction.");
      return;
    }

    const skill = skillChipsData.find(s => s.id === skillId);
    if (skill && skill.certified) {
      addLog(`Riggsy: You are already certified in ${skillName}, commander.`);
      toast.info(`You are already certified in ${skillName}.`);
      return;
    }
    
    requestInstructionMutation.mutate({ skillId, cadetId: user.id });
  };

  return (
    <div className="relative w-full h-full bg-gunmetal border border-burnt-orange p-4 overflow-hidden flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-tech-white text-xl font-bold uppercase tracking-[0.25em]">Training Deck // Academy</h2>
          <div className="text-[11px] text-amber-200 font-mono">Select a skill chip to request instruction.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar">
        {skillChipsData.map(skill => (
          <SkillChip 
            key={skill.id} 
            skill={skill} 
            onRequest={handleRequestInstruction} 
            isRequesting={requestInstructionMutation.isPending}
          />
        ))}
      </div>

      <div className="border border-burnt-orange bg-black/70 p-3 mt-auto">
        <div className="text-[11px] font-mono text-tech-white uppercase tracking-[0.2em] mb-2">Riggsy Traffic</div>
        <div className="space-y-1 text-[11px] font-mono text-amber-200">
          {log.map((entry, idx) => (
            <div key={idx} className="border-b border-burnt-orange/20 pb-1">{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingDeck;

