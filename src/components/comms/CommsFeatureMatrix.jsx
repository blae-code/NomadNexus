import React from 'react';
import {
  Radio, Network, Zap, Users, Shield, Lock, AlertTriangle, Flame,
  ShieldAlert, CheckCircle, XCircle, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasMinRank } from '@/components/permissions';
import { Badge } from '@/components/ui/badge';

/**
 * CommsFeatureMatrix
 * Comprehensive feature access matrix with rank-based gating
 * Shows all available features, required ranks, and current access status
 */
export default function CommsFeatureMatrix({ user, compact = false }) {
  const features = [
    {
      id: 'presence',
      name: 'Presence Grid',
      description: 'View all active participants',
      icon: Users,
      color: 'cyan',
      required: null, // anyone
      enabled: true,
      badge: 'QoS Live'
    },
    {
      id: 'campfire',
      name: 'Campfire Creation',
      description: 'Create casual open voice channels',
      icon: Flame,
      color: 'orange',
      required: 'scout',
      enabled: user && hasMinRank(user, 'scout'),
      badge: 'Scout+'
    },
    {
      id: 'bonfire',
      name: 'Bonfire Management',
      description: 'Create focused PTT event channels',
      icon: ShieldAlert,
      color: 'red',
      required: 'scout',
      enabled: user && hasMinRank(user, 'scout'),
      badge: 'Scout+'
    },
    {
      id: 'broadcast',
      name: 'Broadcast',
      description: 'Wide-reaching message to nets',
      icon: Radio,
      color: 'amber',
      required: 'voyager',
      enabled: user && hasMinRank(user, 'voyager'),
      badge: 'Voyager+'
    },
    {
      id: 'whisper',
      name: 'Whisper',
      description: 'Private targeted message',
      icon: Zap,
      color: 'amber',
      required: 'scout',
      enabled: user && hasMinRank(user, 'scout'),
      badge: 'Scout+'
    },
    {
      id: 'flares',
      name: 'Flares',
      description: 'Alert beacons to nearby users',
      icon: AlertTriangle,
      color: 'orange',
      required: 'scout',
      enabled: user && hasMinRank(user, 'scout'),
      badge: 'Scout+'
    },
    {
      id: 'routing',
      name: 'Fleet Routing',
      description: 'Route command/squad/wing nets',
      icon: Network,
      color: 'cyan',
      required: 'voyager',
      enabled: user && hasMinRank(user, 'voyager'),
      badge: 'Voyager+'
    },
    {
      id: 'bridging',
      name: 'Net Bridging',
      description: 'Link nets for multi-way audio',
      icon: Shield,
      color: 'cyan',
      required: 'founder',
      enabled: user && hasMinRank(user, 'founder'),
      badge: 'Founder+'
    },
    {
      id: 'mute_all',
      name: 'Global Mute',
      description: 'Silence all net audio',
      icon: Lock,
      color: 'red',
      required: 'founder',
      enabled: user && hasMinRank(user, 'founder'),
      badge: 'Founder+'
    }
  ];

  if (compact) {
    return (
      <div className="px-3 py-2 bg-zinc-950/50 border-b border-zinc-900/50 text-[10px] uppercase tracking-widest space-y-2">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="font-bold text-zinc-300">Available Features</span>
          <span className="text-[9px] text-zinc-600">({features.filter(f => f.enabled).length} / {features.length})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {features.map(feature => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded border text-[9px] transition-colors",
                  feature.enabled
                    ? `border-${feature.color}-800/60 bg-${feature.color}-950/30 text-${feature.color}-300`
                    : "border-zinc-800/30 bg-zinc-950/20 text-zinc-600 line-through"
                )}
                title={feature.enabled ? feature.description : `Requires ${feature.required}`}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="hidden sm:inline">{feature.name}</span>
                {!feature.enabled && <Lock className="w-2.5 h-2.5 ml-0.5" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Comms Features</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            {features.filter(f => f.enabled).length} / {features.length} available
          </div>
        </div>
        <div className="text-[10px] text-zinc-500">
          {user ? `Rank: ${user.rank?.toUpperCase()}` : 'No rank assigned'}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {features.map(feature => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.id}
              className={cn(
                "p-3 border rounded-lg transition-all",
                feature.enabled
                  ? `border-${feature.color}-800/50 bg-${feature.color}-950/20 hover:bg-${feature.color}-950/30 hover:border-${feature.color}-700/70`
                  : "border-zinc-800/30 bg-zinc-900/20 opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", feature.enabled ? `text-${feature.color}-400` : "text-zinc-600")} />
                  <span className="text-[11px] font-bold text-zinc-100">{feature.name}</span>
                </div>
                {feature.enabled ? (
                  <CheckCircle className={cn("w-4 h-4 flex-shrink-0", `text-${feature.color}-500`)} />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 text-zinc-600" />
                )}
              </div>
              <p className="text-[9px] text-zinc-400 mb-2">{feature.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-500">
                  {feature.required ? `Requires: ${feature.required.toUpperCase()}+` : 'Public'}
                </span>
                <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0.5", feature.enabled ? `border-${feature.color}-700 text-${feature.color}-300` : "border-zinc-700 text-zinc-500")}>
                  {feature.badge || 'Open'}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rank Legend */}
      <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800/50">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Rank Hierarchy</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {['Pioneer', 'Founder', 'Voyager', 'Scout', 'Vagrant'].map((rank, idx) => (
            <div key={rank} className={cn("px-2 py-1.5 rounded border text-[9px] font-bold text-center", idx === 0 ? "border-purple-700 bg-purple-950/30 text-purple-300" : idx === 1 ? "border-red-700 bg-red-950/30 text-red-300" : idx === 2 ? "border-cyan-700 bg-cyan-950/30 text-cyan-300" : idx === 3 ? "border-emerald-700 bg-emerald-950/30 text-emerald-300" : "border-zinc-700 bg-zinc-950/30 text-zinc-400")}>
              {rank}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
