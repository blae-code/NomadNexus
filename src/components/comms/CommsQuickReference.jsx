import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Shield, Flame, Zap, MessageSquare, VolumeX, Headphones } from 'lucide-react';

/**
 * CommsQuickReference
 * Visual quick reference card for voice comms controls
 * Can be displayed in help/onboarding
 */
export default function CommsQuickReference() {
  const controls = [
    {
      icon: <Radio className="w-5 h-5" />,
      name: 'Push-to-Talk',
      key: 'SPACEBAR',
      color: 'text-emerald-500',
      desc: 'Hold to transmit on active net',
      rank: 'Scout+',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      name: 'Combat Flare',
      key: 'Click',
      color: 'text-orange-500',
      desc: 'Broadcast tactical alert to Rangers',
      rank: 'Scout+',
    },
    {
      icon: <Flame className="w-5 h-5" />,
      name: 'Medical Flare',
      key: 'Click',
      color: 'text-red-500',
      desc: 'Request immediate rescue/medical',
      rank: 'Scout+',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      name: 'Broadcast Mode',
      key: 'Click',
      color: 'text-emerald-500',
      desc: 'Transmit to all connected nets',
      rank: 'Voyager+',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      name: 'Whisper',
      key: 'Select Target',
      color: 'text-amber-500',
      desc: 'Private 1-on-1 communication',
      rank: 'Scout+',
    },
    {
      icon: <VolumeX className="w-5 h-5" />,
      name: 'Priority Mute',
      key: 'Click',
      color: 'text-red-600',
      desc: 'Emergency silence (Command only)',
      rank: 'Founder+',
    },
  ];

  const netTypes = [
    {
      name: 'Campfire',
      icon: '🔥',
      color: 'text-orange-400',
      desc: 'Casual voice, always available',
      mode: 'Open/PTT',
    },
    {
      name: 'Bonfire',
      icon: '🔥',
      color: 'text-red-400',
      desc: 'Tactical PTT, event-based',
      mode: 'PTT Only',
    },
    {
      name: 'Squad Net',
      icon: '👥',
      color: 'text-emerald-400',
      desc: 'Team coordination channel',
      mode: 'PTT',
    },
    {
      name: 'Command',
      icon: '🛡️',
      color: 'text-red-400',
      desc: 'Fleet/Wing command channel',
      mode: 'Priority',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-zinc-800">
        <div className="flex items-center justify-center gap-2 text-orange-500">
          <Radio className="w-6 h-6" />
          <h1 className="text-2xl font-black uppercase tracking-tight">Voice Comms Quick Reference</h1>
        </div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Tactical Communications System</p>
      </div>

      {/* Controls Grid */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-zinc-300">
            <Headphones className="w-4 h-4 inline mr-2" />
            Voice Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {controls.map((control, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className={`${control.color} mt-0.5`}>{control.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{control.name}</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-zinc-500">
                      {control.key}
                    </kbd>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{control.desc}</p>
                  <div className="mt-1 text-[9px] uppercase text-zinc-600 tracking-wider">
                    Requires: <span className="text-orange-500">{control.rank}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Net Types */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-zinc-300">
            <Radio className="w-4 h-4 inline mr-2" />
            Voice Net Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {netTypes.map((net, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-zinc-900/50 border border-zinc-800"
              >
                <span className="text-2xl">{net.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${net.color}`}>{net.name}</span>
                    <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-zinc-500">
                      {net.mode}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{net.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-zinc-300">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-[11px] text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 shrink-0">▸</span>
              <span>Hold <kbd className="px-1 bg-zinc-900 border border-zinc-800 text-zinc-500 mx-1">SPACEBAR</kbd> or click PTT button to transmit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 shrink-0">▸</span>
              <span>Select a net from the list to connect - controls appear automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 shrink-0">▸</span>
              <span>Combat/Medical flares broadcast your location to appropriate roles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 shrink-0">▸</span>
              <span>Use whisper mode for discrete communication during ops</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 shrink-0">▸</span>
              <span>Access audio settings via the gear icon to adjust device/quality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 shrink-0">▸</span>
              <span>Bridge nets (Founder+) to link multiple channels for complex ops</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="bg-zinc-950 border-red-950 border">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-red-400">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-[11px]">
            <div>
              <div className="text-white font-bold mb-1">Can't hear anyone?</div>
              <ul className="text-zinc-400 space-y-1 pl-4">
                <li>• Check browser mic/speaker permissions</li>
                <li>• Verify correct output device in Settings</li>
                <li>• Ensure net connection shows "CONNECTED"</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-bold mb-1">Can't transmit?</div>
              <ul className="text-zinc-400 space-y-1 pl-4">
                <li>• Verify your rank meets net requirements</li>
                <li>• Check for "PRIORITY MUTE" banner (wait for clear)</li>
                <li>• Ensure PTT button shows "READY" not "MUTED"</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-bold mb-1">Echo or poor quality?</div>
              <ul className="text-zinc-400 space-y-1 pl-4">
                <li>• Enable Echo Cancellation in Settings</li>
                <li>• Use headphones to prevent feedback</li>
                <li>• Adjust VAD threshold if breathing triggers PTT</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-[10px] text-zinc-600 uppercase tracking-widest pt-4 border-t border-zinc-900">
        <p>Access full comms console via main navigation for advanced features</p>
        <p className="mt-1">Rank up to unlock additional capabilities</p>
      </div>
    </div>
  );
}
