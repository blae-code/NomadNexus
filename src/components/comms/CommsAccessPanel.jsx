import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Info, Lock, Unlock, Zap, Users, Radio, Flame,
  ShieldAlert, Network, Shield, AlertTriangle, Volume2, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasMinRank } from '@/components/permissions';
import { Button } from '@/components/ui/button';

/**
 * CommsAccessPanel
 * Detailed feature access sidebar with interactive tooltips and rank requirements
 * Shows what the user can do, what they're locked out of, and how to gain access
 */
export default function CommsAccessPanel({ user }) {
  const [expandedFeature, setExpandedFeature] = useState(null);

  const featureGroups = [
    {
      title: 'Voice Channels',
      icon: Flame,
      color: 'orange',
      features: [
        {
          id: 'campfire',
          name: 'Campfire',
          description: 'Open, casual voice channels',
          details: 'Create and manage casual open voice channels for team communication. Perfect for briefings and informal coordination.',
          required: 'scout',
          icon: Flame,
          color: 'orange'
        },
        {
          id: 'bonfire',
          name: 'Bonfire (PTT)',
          description: 'Focused push-to-talk channels',
          details: 'Create event-based PTT-only channels for structured ops and tactical communication. Higher quality, lower latency.',
          required: 'scout',
          icon: ShieldAlert,
          color: 'red'
        }
      ]
    },
    {
      title: 'Messaging & Alerts',
      icon: Radio,
      color: 'amber',
      features: [
        {
          id: 'broadcast',
          name: 'Broadcast',
          description: 'Wide-reaching messages',
          details: 'Send broadcast messages to multiple nets simultaneously. Useful for fleet-wide announcements and coordinated ops.',
          required: 'voyager',
          icon: Radio,
          color: 'amber'
        },
        {
          id: 'whisper',
          name: 'Whisper',
          description: 'Private direct messages',
          details: 'Send targeted whisper messages to specific users. Encrypted and isolated from group channels.',
          required: 'scout',
          icon: Zap,
          color: 'amber'
        },
        {
          id: 'flares',
          name: 'Flares',
          description: 'Alert beacons',
          details: 'Send distress/status flares to nearby units. Immediate visual and audio alert with location data.',
          required: 'scout',
          icon: AlertTriangle,
          color: 'orange'
        }
      ]
    },
    {
      title: 'Network Management',
      icon: Network,
      color: 'cyan',
      features: [
        {
          id: 'routing',
          name: 'Fleet Routing',
          description: 'Command/squad/wing routing',
          details: 'Route command nets, wings, and squads. Automatically direct participants to appropriate nets based on hierarchy.',
          required: 'voyager',
          icon: Network,
          color: 'cyan'
        },
        {
          id: 'bridging',
          name: 'Net Bridging',
          description: 'Link nets together',
          details: 'Bridge multiple nets for seamless multi-way communication. Audio flows transparently between linked nets.',
          required: 'founder',
          icon: Shield,
          color: 'cyan'
        }
      ]
    },
    {
      title: 'Administrative Controls',
      icon: Lock,
      color: 'red',
      features: [
        {
          id: 'mute_all',
          name: 'Global Mute',
          description: 'Silence all audio',
          details: 'Emergency control to silence all nets across the organization. Use carefully - affects all active participants.',
          required: 'founder',
          icon: Volume2,
          color: 'red'
        }
      ]
    },
    {
      title: 'Monitoring & Diagnostics',
      icon: Eye,
      color: 'cyan',
      features: [
        {
          id: 'qos',
          name: 'QoS Metrics',
          description: 'Real-time network stats',
          details: 'Monitor latency, jitter, packet loss, and bandwidth in real-time. Per-user and per-net diagnostics.',
          required: null,
          icon: Zap,
          color: 'cyan'
        },
        {
          id: 'presence',
          name: 'Presence Grid',
          description: 'Active participant view',
          details: 'See all active users across all nets. View connection quality, status, and location data.',
          required: null,
          icon: Users,
          color: 'cyan'
        }
      ]
    }
  ];

  const rankHierarchy = [
    { name: 'Pioneer', abbr: 'P', color: 'purple', power: 6 },
    { name: 'Founder', abbr: 'F', color: 'red', power: 5 },
    { name: 'Voyager', abbr: 'V', color: 'cyan', power: 4 },
    { name: 'Scout', abbr: 'S', color: 'emerald', power: 3 },
    { name: 'Vagrant', abbr: 'V', color: 'zinc', power: 1 }
  ];

  const userRankObj = rankHierarchy.find(r => r.name.toLowerCase() === user?.rank?.toLowerCase());
  const accessibleFeatures = featureGroups
    .flatMap(g => g.features)
    .filter(f => !f.required || hasMinRank(user, f.required));

  return (
    <div className="h-full flex flex-col bg-zinc-950/40 border border-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Comms Access</span>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400">Your Rank:</span>
            <div className={cn("px-2 py-1 rounded text-[10px] font-bold", `bg-${userRankObj?.color}-950/40 border border-${userRankObj?.color}-800/60 text-${userRankObj?.color}-300`)}>
              {user.rank?.toUpperCase()}
            </div>
            <span className="text-[10px] text-zinc-500 ml-2">
              {accessibleFeatures.length} features available
            </span>
          </div>
        ) : (
          <div className="text-[10px] text-zinc-500">Not logged in</div>
        )}
      </div>

      {/* Feature Groups */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-3">
        {featureGroups.map((group) => {
          const GroupIcon = group.icon;
          const groupAccessible = group.features.some(f => !f.required || hasMinRank(user, f.required));

          return (
            <div key={group.title} className={cn("border rounded-lg overflow-hidden", groupAccessible ? `border-${group.color}-800/40 bg-${group.color}-950/10` : "border-zinc-800/30 bg-zinc-900/20 opacity-60")}>
              {/* Group Header */}
              <div className={cn("px-3 py-2 border-b", groupAccessible ? `border-${group.color}-800/30 bg-${group.color}-950/20` : "border-zinc-800/20 bg-zinc-900/30")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GroupIcon className={cn("w-4 h-4", groupAccessible ? `text-${group.color}-400` : "text-zinc-600")} />
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", groupAccessible ? `text-${group.color}-300` : "text-zinc-500")}>
                      {group.title}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500">
                    {group.features.filter(f => !f.required || hasMinRank(user, f.required)).length}/{group.features.length}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="divide-y divide-zinc-800/30">
                {group.features.map((feature) => {
                  const featureAccessible = !feature.required || hasMinRank(user, feature.required);
                  const FeatureIcon = feature.icon;
                  const isExpanded = expandedFeature === feature.id;

                  return (
                    <div key={feature.id} className={cn("p-2", featureAccessible ? `bg-${feature.color}-950/5 hover:bg-${feature.color}-950/15` : "bg-zinc-900/10 opacity-60")}>
                      <button
                        onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                        className="w-full flex items-start justify-between gap-2 text-left hover:text-current transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <FeatureIcon className={cn("w-3.5 h-3.5 flex-shrink-0", featureAccessible ? `text-${feature.color}-400` : "text-zinc-600")} />
                            <span className={cn("text-[10px] font-bold", featureAccessible ? `text-${feature.color}-300` : "text-zinc-600")}>
                              {feature.name}
                            </span>
                            {featureAccessible ? (
                              <Unlock className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Lock className="w-3 h-3 text-red-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className={cn("text-[9px] leading-tight", featureAccessible ? "text-zinc-400" : "text-zinc-600")}>
                            {feature.description}
                          </p>
                        </div>
                        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform", isExpanded ? "rotate-180" : "", featureAccessible ? `text-${feature.color}-500` : "text-zinc-600")} />
                      </button>

                      {/* Expandable Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-2 pt-2 border-t border-zinc-800/20"
                          >
                            <p className="text-[8px] text-zinc-400 leading-relaxed mb-2">
                              {feature.details}
                            </p>
                            {feature.required ? (
                              <div className={cn("px-2 py-1.5 rounded text-[8px] border", featureAccessible ? `border-emerald-800/50 bg-emerald-950/30 text-emerald-300` : `border-amber-800/50 bg-amber-950/30 text-amber-300`)}>
                                {featureAccessible ? (
                                  <span className="flex items-center gap-1">
                                    <Unlock className="w-3 h-3" />
                                    You have access (requires {feature.required.toUpperCase()}+)
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Requires {feature.required.toUpperCase()}+ rank
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="px-2 py-1.5 rounded text-[8px] border border-cyan-800/50 bg-cyan-950/30 text-cyan-300 flex items-center gap-1">
                                <Unlock className="w-3 h-3" />
                                Available to everyone
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - Rank Legend */}
      <div className="shrink-0 px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/30 text-[8px] space-y-1.5">
        <div className="text-zinc-500 font-bold uppercase tracking-widest">Rank Hierarchy</div>
        <div className="flex gap-1 flex-wrap">
          {rankHierarchy.map(rank => (
            <div
              key={rank.name}
              className={cn(
                "px-1.5 py-0.5 rounded border text-[7px] font-bold flex items-center gap-0.5",
                user?.rank?.toLowerCase() === rank.name.toLowerCase()
                  ? `border-${rank.color}-700 bg-${rank.color}-950/40 text-${rank.color}-300 ring-1 ring-${rank.color}-600/50`
                  : `border-${rank.color}-800/40 bg-${rank.color}-950/20 text-${rank.color}-300`
              )}
              title={`Power Level: ${rank.power}`}
            >
              {rank.abbr}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
