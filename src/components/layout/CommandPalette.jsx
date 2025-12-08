import React, { useState, useRef, useEffect } from "react";
import { Search, Terminal } from "lucide-react";

const COMMANDS = [
	{
		label: "Go to Dashboard",
		action: () => (window.location.href = "/NomadOpsDashboard"),
		icon: <Terminal className="w-5 h-5 text-amber-400" />,
	},
	{ label: "Comms Console", action: () => (window.location.href = "/CommsConsole"), icon: <Search className="w-5 h-5 text-amber-400" /> },
	{ label: "Profile", action: () => (window.location.href = "/Profile"), icon: <Search className="w-5 h-5 text-amber-400" /> },
	{ label: "Academy", action: () => (window.location.href = "/Academy"), icon: <Search className="w-5 h-5 text-amber-400" /> },
	{ label: "Treasury", action: () => (window.location.href = "/Treasury"), icon: <Search className="w-5 h-5 text-amber-400" /> },
	{ label: "Quick: Log Out", action: () => (window.location.href = "/login"), icon: <Terminal className="w-5 h-5 text-amber-400" /> },
	// Add more commands as needed
];

export default function CommandPalette({ open, onClose }) {
	const [query, setQuery] = useState("");
	const inputRef = useRef(null);
	const filtered = COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()));

	useEffect(() => {
		if (open && inputRef.current) inputRef.current.focus();
	}, [open]);

	useEffect(() => {
		const handler = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				if (!open) onClose(true);
			}
			if (e.key === "Escape" && open) onClose(false);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, onClose]);

	if (!open) return null;
	return (
		<div
			className="fixed inset-0 z-[100] bg-black/70 flex items-start justify-center pt-32"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose(false);
			}}
		>
			<div className="bg-zinc-900 border-2 border-[var(--burnt-orange)] rounded-xl shadow-2xl w-full max-w-xl p-0.5 animate-fade-in">
				<div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-black/80 rounded-t-xl">
					<Search className="w-5 h-5 text-amber-400 mr-2" />
					<input
						ref={inputRef}
						className="flex-1 bg-transparent outline-none text-lg text-amber-100 placeholder-zinc-500 font-mono"
						placeholder="Type a command or destination..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						autoFocus
					/>
					<kbd
						className="ml-4 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 cursor-pointer hover:text-amber-400 transition-colors"
						title="Close (Esc)"
						onClick={() => onClose(false)}
					>
						ESC
					</kbd>
				</div>
				<ul className="max-h-72 overflow-y-auto divide-y divide-zinc-800 bg-black/70">
					{filtered.length === 0 && <li className="p-4 text-zinc-500 text-center font-mono">No results</li>}
					{filtered.map((cmd, i) => (
						<li
							key={i}
							className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--burnt-orange)]/10 transition-colors text-amber-100 font-mono"
							onClick={() => {
								cmd.action();
								onClose(false);
							}}
						>
							{cmd.icon}
							<span>{cmd.label}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
