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
                    className="w-full bg-emerald-500/70"
                    initial={{ height: '2px' }}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                />
            )
        })}
    </div>
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
                    "bg-zinc-950/80 border-2 w-full max-w-xl p-1 shadow-2xl shadow-amber-900/30",
                    isActive ? 'border-amber-500' : 'border-zinc-700'
                )}
                transition={{ duration: 0.2, ease: 'easeOut' }}
			>
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

                {parsedCommand && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                           {parsedCommand.error ? <Terminal className="w-4 h-4 text-red-500" /> : <CornerRightDown className="w-4 h-4 text-emerald-500" />}
                            <span className="font-mono text-sm text-zinc-300">
                                <span className={cn("font-bold", parsedCommand.error ? "text-red-500" : "text-amber-400")}>{parsedCommand.cmd}</span>
                                {parsedCommand.args.map((arg, i) => <span key={i} className="text-cyan-400 ml-2">{arg}</span>)}
                            </span>
                        </div>
                        {parsedCommand.error ? (
                             <span className="text-xs font-mono uppercase text-red-500">{parsedCommand.error}</span>
                        ) : (
                             <span className="text-xs font-mono uppercase text-emerald-500">Command Ready</span>
                        )}
                    </motion.div>
                )}
				
                <ul className="max-h-60 overflow-y-auto divide-y divide-zinc-800/50 bg-black/30">
					{COMMANDS.filter(c => c.cmd.includes(query) || c.label.toLowerCase().includes(query)).map((cmd, i) => (
						<li
							key={i}
							className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-amber-900/20 transition-colors text-zinc-400 hover:text-amber-300 font-mono text-sm"
							onClick={() => setQuery(cmd.cmd + " ")}
						>
							<span className="font-bold text-amber-500 w-24">{cmd.cmd}</span>
                            <span className="flex-1">{cmd.label}</span>
							<span className="text-xs text-zinc-500">{cmd.example}</span>
						</li>
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
