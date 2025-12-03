import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const announcements = [
  "ALERT: NOMAD FLEET EXERCISE 'RED SHIFT' COMMENCING IN T-MINUS 00:05:00. ALL PERSONNEL REPORT TO STATIONS.",
  "WARNING: UNREGISTERED SIGNATURE DETECTED SECTOR GAMMA-7. PROCEED WITH CAUTION.",
  "RIGGSY: 'Don't forget to hydrate, meatbags. Dehydration affects reaction times.'",
  "MISSION UPDATE: SUPPLY CONVOY ETA 03:20:00. PREPARE FOR DOCKING PROCEDURES.",
];

const HoloBoard = () => {
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 10000); // Change announcement every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-gunmetal border-b border-burnt-orange py-1 px-4 overflow-hidden relative">
      <div className="flex items-center justify-center h-full text-center">
        <motion.p
          key={currentAnnouncement}
          initial={{ x: '100%' }}
          animate={{ x: '-100%' }}
          transition={{ duration: 10, ease: 'linear', repeat: Infinity, delay: 0 }}
          className="absolute whitespace-nowrap text-tech-white text-sm uppercase font-bold tracking-widest"
          style={{ willChange: 'transform' }} // Optimize for animation
        >
          {announcements[currentAnnouncement]}
        </motion.p>
      </div>
    </div>
  );
};

export default HoloBoard;
