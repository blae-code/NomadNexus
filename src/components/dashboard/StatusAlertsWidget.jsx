import React from "react";
import { AlertTriangle, Wifi, WifiOff, Coins, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";

export default function StatusAlertsWidget() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser().catch((err) => console.error('Status widget auth fetch failed', err));
  }, []);

  // 1. Rescue Alert Check (Any player in DISTRESS)
  const { data: distressSignals = [] } = useQuery({
    queryKey: ['dashboard-distress'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('player_status')
        .select('id')
        .eq('status', 'DISTRESS')
        .limit(1);
      if (error) {
        console.error('Distress fetch failed', error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 5000
  });
  const hasRescueRequest = distressSignals.length > 0;

  // 2. Comms Status Check (User's status)
  const { data: myStatus } = useQuery({
    queryKey: ['my-comms-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('player_status')
        .select('*')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false })
        .limit(1);
      if (error) {
        console.error('My status fetch failed', error);
        return null;
      }
      return (data || [])[0] || null;
    },
    enabled: !!user,
    refetchInterval: 10000
  });
  
  const isOnline = myStatus && myStatus.status !== 'OFFLINE';
  const commsText = isOnline 
    ? `Connected: ${myStatus.assigned_squad_id ? 'Squad Net' : 'General Net'}`
    : "Comms Offline";

  // 3. AUEC Low Warning (General Coffer)
  const { data: cofferWarning } = useQuery({
    queryKey: ['dashboard-coffer-check'],
    queryFn: async () => {
      if (!supabase) return null;
      const { data: coffers, error: cofferErr } = await supabase
        .from('coffers')
        .select('id')
        .eq('type', 'GENERAL')
        .limit(1);
      if (cofferErr || !coffers || coffers.length === 0) return null;
      const cofferId = coffers[0].id;
      const { data: txs, error: txErr } = await supabase
        .from('coffer_transactions')
        .select('amount')
        .eq('coffer_id', cofferId);
      if (txErr) {
        console.error('Coffer tx fetch failed', txErr);
        return null;
      }
      const balance = (txs || []).reduce((acc, tx) => acc + (tx.amount || 0), 0);
      return balance < 500000 ? balance : null;
    }
  });

  return (
    <div className="flex flex-col gap-3 h-full border border-[var(--burnt-orange)] bg-[var(--gunmetal)] p-3">
      <div className="label-plate px-2 py-1 flex items-center gap-2 text-[10px]">Status Alerts</div>

      {hasRescueRequest && (
        <a href={createPageUrl("CommsConsole?view=rescue")} className="block">
          <div className="data-cell px-4 py-3 border-[var(--burnt-orange)] bg-[#210202] animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#8a0303] text-white p-2 border border-black">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[#ffbf00] font-black uppercase tracking-[0.24em] text-xs">Critical Alert</div>
                <div className="text-white font-black text-sm tracking-wider">Active Rescue Request</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#ffbf00]" />
          </div>
        </a>
      )}

      <div className="flex-1 flex flex-col gap-3">
        <div className="data-cell px-4 py-3 flex items-center justify-between border border-[var(--burnt-orange)]">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 border bg-black", isOnline ? "border-[#00ff41] text-[#00ff41]" : "border-[#8a0303] text-[#8a0303]")}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <div className="label-plate px-1 py-0.5 text-[9px]">Comms Link</div>
              <div className={cn("text-sm font-black font-mono", isOnline ? "text-[#00ff41]" : "text-[#8a0303]")}>{commsText}</div>
            </div>
          </div>
          <div className={cn("w-3 h-3 border", isOnline ? "border-[#00ff41] bg-[#00ff41] animate-pulse" : "border-[#8a0303] bg-[#8a0303]")} />
        </div>

        {cofferWarning !== null && cofferWarning !== undefined && (
          <div className="data-cell px-4 py-3 flex items-center justify-between border border-[var(--burnt-orange)]">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#ffbf00] bg-black text-[#ffbf00]">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="label-plate px-1 py-0.5 text-[9px]">Finance Alert</div>
                <div className="text-sm font-black text-[#ffbf00]">ORG FUNDS CRITICAL</div>
              </div>
            </div>
            <div className="text-sm font-black text-[#ffbf00]">{cofferWarning.toLocaleString()} aUEC</div>
          </div>
        )}
      </div>
    </div>
  );
}
