import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, Terminal, X, CornerRightDown, Bot, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveKit, AUDIO_STATE } from "@/hooks/useLiveKit";
import { cn } from "@/lib/utils";

const COMMANDS = [
	{ cmd: "/nav", label: "Navigate to page", example: "/nav <page>" },
	{ cmd: "/hail", label: "Hail participant (whisper)", example: "/hail <callsign>" },
	{ cmd: "/riggsy", label: "Issue command to Riggsy", example: "/riggsy <query>" },
    { cmd: "/deploy", label: "Deploy to voice net", example: "/deploy <net-code>" },
];

const Waveform = ({ audioLevel }) => (
    <div className="w-full h-8 flex items-center gap-px">
        {Array(32).fill(0).map((_, i) => {
            const barHeight = Math.max(2, (audioLevel * (1 - Math.sin(i / 10))) * 100);
            return (
                <motion.div
                    key={i}
                    className="w-full rounded-full bg-gradient-to-t from-emerald-500 to-emerald-400"
                    initial={{ height: '2px' }}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ duration: 0.05, ease: 'easeOut' }}
                />
            )
        })}
    </div>
)

// Phase 4.1: Breathing border effect for Standby Mode
const BreathingBorder = () => (
    <motion.div
        animate={{
            boxShadow: [
                'inset 0 0 0 1px rgba(113, 63, 18, 0.3)',
                'inset 0 0 0 1px rgba(180, 83, 9, 0.5)',
                'inset 0 0 0 1px rgba(113, 63, 18, 0.3)',
            ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
    />
)

export default function CommandPalette({ open, onClose }) {
	const [query, setQuery] = useState("");
	const [isActive, setIsActive] = useState(false);
	const inputRef = useRef(null);
    const { audioState, localAudioLevel, publishRiggsyQuery, publishWhisper, connectNet, room } = useLiveKit();
    const isMicActive = audioState === AUDIO_STATE.CONNECTED_OPEN;

	const parsedCommand = useMemo(() => {
		if (!query.startsWith("/")) return null;
		const parts = query.split(" ");
		const cmd = parts[0];
		const args = parts.slice(1);
		const commandDef = COMMANDS.find(c => c.cmd === cmd);
		if (!commandDef) return { cmd, args, error: "Unknown command" };
		return { ...commandDef, args };
	}, [query]);

	useEffect(() => {
		if (open) {
			setTimeout(() => {
                setIsActive(true);
                inputRef.current?.focus();
            }, 100);
		} else {
            setIsActive(false);
            setQuery("");
        }
	}, [open]);

	useEffect(() => {
		const handler = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				onClose(!open);
			}
			if (e.key === "Escape" && open) onClose(false);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, onClose]);
    
    const handleCommandExecution = () => {
        if (!parsedCommand || parsedCommand.error) return;

        switch (parsedCommand.cmd) {
            case '/riggsy':
                publishRiggsyQuery(parsedCommand.args.join(' '));
                break;
            case '/hail':
                // This is a simplification. A real implementation would need to
                // resolve the callsign to a participant ID.
                console.warn(`Attempting to hail: ${parsedCommand.args[0]}`);
                break;
            case '/deploy':
                // This requires a net object. Simplified for now.
                console.warn(`Attempting to deploy to net: ${parsedCommand.args[0]}`);
                break;
            case '/nav':
                window.location.href = `/${parsedCommand.args[0]}`;
                break;
        }
        onClose(false);
    }

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-32"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose(false);
			}}
		>
			<motion.div
                layout
				className={cn(
                    "bg-zinc-950/80 border-2 w-full max-w-xl p-1 relative",
                    isActive ? 'border-amber-500 shadow-2xl' : 'border-orange-900/40'
                )}
                animate={{
                    boxShadow: isActive 
                        ? 'rgba(217, 119, 6, 0.4) 0px 0px 20px'
                        : [
                            'rgba(180, 83, 9, 0.1) 0px 0px 10px',
                            'rgba(217, 119, 6, 0.15) 0px 0px 15px',
                            'rgba(180, 83, 9, 0.1) 0px 0px 10px',
                        ]
                }}
                transition={{
                    boxShadow: isActive
                        ? { duration: 0.3 }
                        : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                }}
			>
                {/* Phase 4.1: Breathing border for Standby Mode */}
                {!isActive && <BreathingBorder />}
                {/* Reticle brackets */}
                <AnimatePresence>
                    {isActive && [
                        { top: -2, left: -2, w: '2rem', h: '2px', bg: 'bg-amber-500' },
                        { top: -2, left: -2, w: '2px', h: '2rem', bg: 'bg-amber-500' },
                        { top: -2, right: -2, w: '2rem', h: '2px', bg: 'bg-amber-500' },
                        { top: -2, right: -2, w: '2px', h: '2rem', bg: 'bg-amber-500' },
                        { bottom: -2, left: -2, w: '2rem', h: '2px', bg: 'bg-amber-500' },
                        { bottom: -2, left: -2, w: '2px', h: '2rem', bg: 'bg-amber-500' },
                        { bottom: -2, right: -2, w: '2rem', h: '2px', bg: 'bg-amber-500' },
                        { bottom: -2, right: -2, w: '2px', h: '2rem', bg: 'bg-amber-500' },
                    ].map((style, i) => (
                        <motion.div
                            key={i}
                            className={cn("absolute", style.bg)}
                            style={{ width: style.w, height: style.h, top: style.top, left: style.left, bottom: style.bottom, right: style.right }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ delay: 0.1 + i * 0.02 }}
                        />
                    ))}
                </AnimatePresence>
                
				<div className="flex items-center px-4 py-2 border-b border-zinc-800/50">
                    {/* Phase 4.1: Status Diode */}
                    <motion.div 
                        animate={{
                            boxShadow: isActive
                                ? 'rgba(16, 185, 129, 0.8) 0px 0px 12px'
                                : 'rgba(217, 119, 6, 0.6) 0px 0px 8px',
                            backgroundColor: isActive ? '#10b981' : '#d97706'
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-3 h-3 rounded-full mr-3 border border-amber-900/50"
                    />
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1, transition: {delay: 0.2}}}>
					    <Terminal className="w-5 h-5 text-amber-400 mr-3" />
                    </motion.div>
					<input
						ref={inputRef}
						className="flex-1 bg-transparent outline-none text-lg text-amber-200 placeholder-zinc-500 font-mono"
						placeholder="Neural command..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommandExecution();
                        }}
					/>
					<button
						className="ml-4 p-2 rounded-sm bg-zinc-800/50 text-xs text-zinc-300 border border-zinc-700/50 cursor-pointer hover:text-amber-400 hover:border-amber-600/50 transition-colors"
						title="Close (Esc)"
						onClick={() => onClose(false)}
					>
						<X className="w-4 h-4" />
					</button>
				</div>

                {/* Command Chip - Phase 4.2 */}
                {parsedCommand && !parsedCommand.error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -5 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="px-4 py-2 flex items-center gap-2"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-900/30 border border-amber-700/60 rounded-sm">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">CHIP:</span>
                            <span className="text-xs font-mono text-amber-300">{parsedCommand.cmd} {parsedCommand.args.join(' ')}</span>
                        </div>
                    </motion.div>
                )}

                {parsedCommand?.error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-3 border-b border-red-800/50 bg-red-900/10 flex items-center gap-2"
                    >
                        <Terminal className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-mono uppercase text-red-400">{parsedCommand.error}</span>
                    </motion.div>
                )}
				
                {/* Phase 4.4: Hard-Lock Result Styling */}
                <ul className="max-h-60 overflow-y-auto divide-y divide-zinc-800/50 bg-black/30">
					{COMMANDS.filter(c => c.cmd.includes(query) || c.label.toLowerCase().includes(query)).map((cmd, i) => (
						<motion.li
							key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
							className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-all font-mono text-sm group relative border border-transparent hover:border-amber-600/50 hover:bg-amber-950/20"
							onClick={() => setQuery(cmd.cmd + " ")}
						>
                            {/* Chevron cursor >> on hover - Phase 4.4 */}
                            <span className="absolute left-1 text-amber-600/0 group-hover:text-amber-500 transition-colors text-xs font-bold">»</span>
							<span className="font-bold text-amber-600 w-24 pl-4">{cmd.cmd}</span>
                            <span className="flex-1 text-zinc-400 group-hover:text-amber-200 transition-colors">{cmd.label}</span>
							<span className="text-xs text-zinc-600 group-hover:text-amber-400 transition-colors">{cmd.example}</span>
						</motion.li>
					))}
				</ul>
                
                <div className="px-2 py-1 border-t border-zinc-800/50 bg-black/50 flex items-center justify-between">
                    <div className="w-32">
                        {isMicActive && <Waveform audioLevel={localAudioLevel} />}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono uppercase">
                       <span className={cn("flex items-center gap-1.5", room ? "text-emerald-400" : "text-zinc-600")}>
                           <Radio className="w-3 h-3" /> {room ? "NETLINK" : "OFFLINE"}
                       </span>
                       <span className={cn("flex items-center gap-1.5", isMicActive ? "text-emerald-400" : "text-zinc-600")}>
                           <Bot className="w-3 h-3" /> RIGGSY: {isMicActive ? "LISTENING" : "IDLE"}
                       </span>
                    </div>
                </div>
			</motion.div>
		</div>
	);
}
