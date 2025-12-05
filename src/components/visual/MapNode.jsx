import React from 'react';
import { Handle } from '@xyflow/react';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, MapPin } from 'lucide-react';

const MapNode = ({ data }) => {
    const { type, label, sublabel, status } = data;

    const renderContent = () => {
        switch (type) {
            case 'asset':
                return (
                    <div className="w-4 h-4 bg-blue-500 transform rotate-45" />
                );
            case 'squad':
                return (
                    <Users className="w-5 h-5 text-emerald-500" />
                );
            case 'distress_signal':
                return (
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                    </motion.div>
                );
            case 'sector':
                 return (
                    <div className="w-24 h-24 border border-dashed border-zinc-700 rounded-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-xs font-bold uppercase text-zinc-500">{label}</div>
                            <div className="text-[10px] uppercase tracking-wider text-zinc-600">{sublabel}</div>
                        </div>
                    </div>
                 );
            default:
                return (
                    <MapPin className="w-5 h-5 text-gray-500" />
                );
        }
    };

    return (
        <div className="flex flex-col items-center">
            {renderContent()}
            {type !== 'sector' && (
              <div className="mt-2 text-center">
                  <div className="text-xs font-bold text-white">{label}</div>
                  {sublabel && <div className="text-[10px] text-zinc-400">{sublabel}</div>}
              </div>
            )}
        </div>
    );
};

export default MapNode;
