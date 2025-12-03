import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import CampfireNode from './CampfireNode';
import { TacticalFlare, FlareContextMenu, handleRescueRequest } from './TacticalFlare';
import { useLiveKit } from '@/hooks/useLiveKit';
import SpatialMixer from '@/api/SpatialMixer';

const campfires = [
  { id: 1, name: 'Lounge Campfire', participants: 3, locked: false, x: 100, y: 200, isLFG: true },
  { id: 2, name: 'Rangers Campfire', participants: 0, locked: false, x: 400, y: 150, audioMode: 'PTT_REQUIRED' },
  { id: 3, name: 'Command Tent', participants: 1, locked: true, x: 300, y: 400, isPrioritySpeakerActive: true },
  { id: 4, name: 'Scout Outpost', participants: 5, softCap: 4, locked: false, x: 600, y: 300 },
];

const Spark = ({ onDrag, onDragEnd, onContextMenu }) => {
  return (
    <motion.div
      drag
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
      dragConstraints={{ left: 0, right: 800, top: 0, bottom: 600 }}
      className="w-8 h-8 bg-white shadow-lg cursor-pointer absolute"
      style={{
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      }}
    >
      <div className="w-full h-full bg-tech-white" />
    </motion.div>
  );
};

const SignalMap = () => {
  const { publishData, publishAck, lastFlare, setListenerPosition, roleProfile } = useLiveKit();
  const [currentCampfireId, setCurrentCampfireId] = useState(1);
  const [tether, setTether] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
  const [hoveredCampfireId, setHoveredCampfireId] = useState(null);
  const sparkRef = useRef(null);
  const campfireRefs = useRef({});
  const [contextMenu, setContextMenu] = useState(null);
  const [activeFlares, setActiveFlares] = useState([]);
  const [sparkPosition, setSparkPosition] = useState({ x: campfires[0].x + 64, y: campfires[0].y + 64 });
  const mapRef = useRef(null);
  const spatialMixerRef = useRef(new SpatialMixer());

  const currentCampfire = campfires.find(c => c.id === currentCampfireId);

  useEffect(() => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    spatialMixerRef.current.setStage({ width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    const sparkElement = sparkRef.current;
    const campfireElement = campfireRefs.current[currentCampfireId];
    const mapRect = mapRef.current?.getBoundingClientRect();
    if (sparkElement && campfireElement && mapRect) {
        const sparkRect = sparkElement.getBoundingClientRect();
        const campfireRect = campfireElement.getBoundingClientRect();
        const mapOffsetX = mapRect.left;
        const mapOffsetY = mapRect.top;
        const newTether = {
            x1: campfireRect.left - mapOffsetX + campfireRect.width / 2,
            y1: campfireRect.top - mapOffsetY + campfireRect.height / 2,
            x2: sparkRect.left - mapOffsetX + sparkRect.width / 2,
            y2: sparkRect.top - mapOffsetY + sparkRect.height / 2,
        };
        setTether(newTether);
        setSparkPosition({ x: newTether.x2, y: newTether.y2 });
        setListenerPosition({ x: newTether.x2, y: newTether.y2 });
    }
  }, [currentCampfireId]);


  const handleDrag = (event, info) => {
    const mapRect = mapRef.current?.getBoundingClientRect();
    const rawX = info.point.x - (mapRect?.left || 0);
    const rawY = info.point.y - (mapRect?.top || 0);
    const boundedX = Math.min(Math.max(rawX, 0), mapRect?.width || rawX);
    const boundedY = Math.min(Math.max(rawY, 0), mapRect?.height || rawY);
    setTether(prev => ({ ...prev, x2: boundedX, y2: boundedY }));
    setSparkPosition({ x: boundedX, y: boundedY });

    // Check for proximity
    let closestCampfire = null;
    let minDistance = Infinity;

    campfires.forEach(campfire => {
      const campfireElement = campfireRefs.current[campfire.id];
      const mapRect = mapRef.current?.getBoundingClientRect();
      if (campfireElement && mapRect) {
        const rect = campfireElement.getBoundingClientRect();
        const centerX = rect.left - mapRect.left + rect.width / 2;
        const centerY = rect.top - mapRect.top + rect.height / 2;
        const distance = Math.sqrt(Math.pow(boundedX - centerX, 2) + Math.pow(boundedY - centerY, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestCampfire = campfire;
        }
      }
    });

    if (minDistance < 100 && closestCampfire.id !== currentCampfireId) {
      setHoveredCampfireId(closestCampfire.id);
    } else {
      setHoveredCampfireId(null);
    }
  };

  const handleDragEnd = (event, info) => {
    const targetCampfire = hoveredCampfireId || currentCampfireId;
    if (hoveredCampfireId) {
      setCurrentCampfireId(hoveredCampfireId);
    }
    const sparkElement = sparkRef.current;
    const campfireElement = campfireRefs.current[targetCampfire];
    const mapRect = mapRef.current?.getBoundingClientRect();
    if (sparkElement && campfireElement && mapRect) {
        const sparkRect = sparkElement.getBoundingClientRect();
        const campfireRect = campfireElement.getBoundingClientRect();
        const mapOffsetX = mapRect.left;
        const mapOffsetY = mapRect.top;
        const tetherLine = {
            x1: campfireRect.left - mapOffsetX + campfireRect.width / 2,
            y1: campfireRect.top - mapOffsetY + campfireRect.height / 2,
            x2: sparkRect.left - mapOffsetX + sparkRect.width / 2,
            y2: sparkRect.top - mapOffsetY + sparkRect.height / 2,
        };
        setTether(tetherLine);
        setSparkPosition({ x: tetherLine.x2, y: tetherLine.y2 });
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const handleFlareSelect = (type) => {
    // Gate flare launch to Rescue/Ranger roles
    if (roleProfile && !['Ranger', 'Rescue', 'Medic', 'Pioneer', 'Command'].includes(roleProfile)) {
      console.warn('Insufficient role to launch flare');
      return;
    }
    handleRescueRequest(type, publishData);
    const newFlare = {
      id: Date.now(),
      type,
      position: { x: contextMenu.x, y: contextMenu.y },
    };
    setActiveFlares(prev => [...prev, newFlare]);
    setContextMenu(null);
  };

  const acknowledgeFlare = (id) => {
    setActiveFlares(prev => prev.filter(flare => flare.id !== id));
    publishAck({ type: 'FLARE_ACK', ts: Date.now() });
  };


  return (
    <div ref={mapRef} className="relative w-full h-full bg-gunmetal overflow-hidden" onClick={() => setContextMenu(null)}>
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-[0.04]"
           style={{ backgroundImage: 'linear-gradient(rgba(204, 85, 0, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(204, 85, 0, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <line x1={tether.x1} y1={tether.y1} x2={tether.x2} y2={tether.y2} stroke="white" strokeWidth="1" />
      </svg>

      {/* Campfire Nodes */}
      {campfires.map(campfire => (
        <div
          key={campfire.id}
          className="absolute"
          ref={el => campfireRefs.current[campfire.id] = el}
          style={{ left: campfire.x, top: campfire.y }}
        >
          <CampfireNode
            name={campfire.name}
            participantCount={campfire.participants}
            isLocked={campfire.locked}
            isSpeaking={hoveredCampfireId === campfire.id}
            isLFG={campfire.isLFG}
            audioMode={campfire.audioMode}
            isPrioritySpeakerActive={campfire.isPrioritySpeakerActive}
            softCap={campfire.softCap}
          />
          <div className="mt-1 text-[10px] font-mono text-tech-white/60 text-center">
            {(() => {
              const mix = spatialMixerRef.current.calculateMix(
                { x: campfire.x + 64, y: campfire.y + 64 },
                sparkPosition
              );
              return `PAN ${mix.pan > 0 ? '+' : ''}${mix.pan} | GAIN ${mix.gain}`;
            })()}
          </div>
        </div>
      ))}
      <div ref={sparkRef} style={{left: currentCampfire.x + 64, top: currentCampfire.y + 64}} onContextMenu={handleContextMenu}>
        <Spark onDrag={handleDrag} onDragEnd={handleDragEnd} />
      </div>

      {contextMenu && <FlareContextMenu position={contextMenu} onSelect={handleFlareSelect} />}
      
      {activeFlares.map(flare => (
        <TacticalFlare 
            key={flare.id} 
            type={flare.type} 
            position={flare.position} 
          onAcknowledge={() => acknowledgeFlare(flare.id)} 
          showRespond
          responderRole="Ranger"
          currentRole={roleProfile}
        />
      ))}
      {lastFlare && (
        <TacticalFlare 
          key={`rx-${lastFlare.variant}-${lastFlare.loc}-${lastFlare.type}`}
          type={lastFlare.variant}
          position={{ x: tether.x2, y: tether.y2 }}
          onAcknowledge={() => {
            publishAck({ type: 'FLARE_ACK', ts: Date.now(), variant: lastFlare.variant });
            setActiveFlares([]);
          }}
          showRespond
          responderRole="Ranger"
          currentRole={roleProfile}
        />
      )}
    </div>
  );
};

export default SignalMap;
