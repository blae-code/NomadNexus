import React from 'react';

const QuantumSpooler = ({ size = 84, label = 'QUANTUM SPOOLING' }) => {
  const radius = size * 0.38;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * 0.18;
  const gap = circumference * 0.12;

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-amber-200 font-mono uppercase tracking-[0.28em]">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="animate-quantum-spin drop-shadow-[0_0_18px_rgba(234,88,12,0.35)]"
      >
        <defs>
          <linearGradient id="quantumGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffbf00" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#ea580c" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1ae7ff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth="5"
          opacity="0.45"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#quantumGlow)"
          strokeWidth="5"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 12px rgba(234,88,12,0.45))' }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius * 0.65}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="3"
          strokeDasharray={`${dash * 0.9} ${gap * 1.2}`}
          strokeDashoffset={dash * 0.6}
          opacity="0.75"
        />
      </svg>
      <div className="text-[10px] text-center tracking-[0.3em] text-amber-100">
        {label}
      </div>
    </div>
  );
};

export default QuantumSpooler;
