
import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { Terminal, Search, Clock, User, LogOut } from 'lucide-react';
import CommandPalette from "@/components/layout/CommandPalette";
import { getRankColorClass } from "@/components/utils/rankUtils";
import { cn } from "@/lib/utils";
import ActivityBar from "@/components/layout/ActivityBar";
import NetworkStatusIndicator from "@/components/layout/NetworkStatusIndicator";
import { supabase } from "../lib/supabase";
import { useLiveKit } from '@/hooks/useLiveKit';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';

export default function Layout({ children, currentPageName }) {
  const [time, setTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const { connectShell, shellConnectionState } = useLiveKit();

  // Auto-connect to shell room (always-on data plane)
  const participantName = user?.callsign || user?.rsi_handle || user?.email || 'Nomad-Shell-User';
  const { token, serverUrl } = useLiveKitToken('nomad-ops-shell', participantName, user?.id, user?.rank);

  useEffect(() => {
    console.log('[Layout] Shell connection check:', { 
      hasUser: !!user, 
      hasToken: !!token, 
      hasServerUrl: !!serverUrl,
      shellConnectionState,
      participantName
    });

    if (!user || !token || !serverUrl) {
      console.log('[Layout] Waiting for user, token, or serverUrl');
      return;
    }

    if (shellConnectionState === 'connected' || shellConnectionState === 'connecting') {
      console.log('[Layout] Shell already connected or connecting');
      return;
    }

    console.log('[Layout] Initiating shell connection...');
    connectShell({
      roomName: 'nomad-ops-shell',
      participantName,
      role: user.rank,
      userId: user.id,
      tokenOverride: token,
      serverUrlOverride: serverUrl,
    });
  }, [user, token, serverUrl, shellConnectionState, connectShell, participantName]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const fetchUser = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase.auth.getUser();
        const sessionUser = data?.user;
        if (!sessionUser) {
          setUser(null);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();
        
        // Normalize rank to lowercase
        if (profile?.rank) {
          profile.rank = profile.rank.toLowerCase();
        }
        
        setUser(profile || sessionUser);
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchUser();
    return () => clearInterval(timer);
  }, []);

  const walletBalance =
    user?.auec_wallet ??
    user?.wallet_balance ??
    user?.auec ??
    user?.wallet ??
    null;
  const orgCoffer = user?.org_coffer_total ?? user?.coffer_total ?? null;
  const formatAuec = (val) => {
    if (val === null || val === undefined) return "—";
    const num = Number(val);
    if (Number.isNaN(num)) return "—";
    return `${num.toLocaleString()} aUEC`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-[#ea580c]/30 flex flex-col overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

        :root {
          --font-sans: 'Rajdhani', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          --radius: 0px !important;
        }

        body {
          font-family: var(--font-sans);
          background-color: #09090b;
          color: #e4e4e7;
        }
        
        /* Force sharp corners on everything */
        * {
          border-radius: 0px !important;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #18181b;
        }
        ::-webkit-scrollbar-thumb {
          background: #3f3f46;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #ea580c;
        }

        /* Global button hover effect */
        button, .button-hover-effect {
          transition: all 0.1s ease-out;
        }
        button:hover, .button-hover-effect:hover {
          border-color: #ea580c !important;
          box-shadow: 0 0 8px rgba(234, 88, 12, 0.2);
        }
        
        /* Technical borders */
        .tech-border {
          border: 1px solid #27272a;
          position: relative;
        }
        .tech-border:after {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          width: 6px;
          height: 6px;
          border-top: 1px solid #ea580c;
          border-left: 1px solid #ea580c;
          opacity: 0.5;
        }
      `}</style>

      {/* TacticalHeader will now be used for the header/banner */}
      {/* Page Content */}
      <div className="flex-1 flex overflow-hidden relative">
         <ActivityBar />
         <div className="flex-1 relative overflow-hidden flex flex-col">
            {children}
         </div>
      </div>
    </div>
  );
}
