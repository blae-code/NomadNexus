import React from 'react';
import { motion } from 'framer-motion';

const tintFilters = {
  green: 'grayscale(1) sepia(0.9) hue-rotate(80deg) saturate(2.6) brightness(0.7)',
  amber: 'grayscale(1) sepia(0.9) hue-rotate(-20deg) saturate(2.4) brightness(0.78)',
};

const HoloThumbnail = ({ src, alt, tint = 'green', size = '96px' }) => {
  const filter = tintFilters[tint] || tintFilters.green;

  return (
    <motion.div
      className="relative inline-block overflow-hidden border border-burnt-orange/60 bg-black/60 holo-thumb group"
      style={{ '--holo-filter': filter, width: size, height: size }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
    >
      <img
        src={src}
        alt={alt}
        className="object-cover w-full h-full"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="absolute inset-0 border border-amber-500/40 mix-blend-screen" />
      <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-gradient-to-br from-amber-500/10 to-transparent" />
    </motion.div>
  );
};

export default HoloThumbnail;
