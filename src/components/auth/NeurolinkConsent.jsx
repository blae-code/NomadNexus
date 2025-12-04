import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const NeurolinkConsent = ({ user, onAccept }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setError('');
    setLoading(true);
    try {
      if (!supabase || !user) {
        throw new Error('Unable to record protocol acknowledgment.');
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tos_accepted_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updateError) throw updateError;
      if (onAccept) onAccept();
    } catch (err) {
      console.error('Consent acceptance failed', err);
      setError('Signal interference detected. Retry the protocol.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      await supabase?.auth?.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign out failed', err);
      setError('Failsafe disengage failed. Attempt manual logoff.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl text-tech-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(204,85,0,0.2),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.05),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(204,85,0,0.1),transparent_40%)]" />
      <div className="relative w-full max-w-4xl mx-6 border border-burnt-orange bg-black/80 shadow-[0_0_40px_rgba(204,85,0,0.35)] overflow-hidden">
        <div className="absolute inset-0 border border-burnt-orange/40 animate-pulse opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(204,85,0,0.12)_35%,transparent_70%)] animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_6px)] opacity-50 mix-blend-screen" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-burnt-orange/25 to-transparent mix-blend-screen animate-scanline" />
        <div className="absolute -inset-1 border border-burnt-orange/60 blur-sm animate-flicker" />

        <div className="relative px-10 py-10 space-y-6 font-mono">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.32em] text-burnt-orange">UEE / ADVOCACY</p>
              <h1 className="text-2xl font-black tracking-[0.24em] text-tech-white uppercase">
                DATA PRIVACY DIRECTIVE 711
              </h1>
              <p className="text-sm tracking-[0.2em] text-burnt-orange/80">
                PROTOCOL: NEURAL_LINK_V.2955.12.03
              </p>
            </div>
            <div className="text-right text-xs text-tech-white/70">
              <p className="tracking-[0.18em]">Nomad Nexus // Network Security Division</p>
              <p className="tracking-[0.14em] text-burnt-orange">Status: Awaiting pilot confirmation</p>
            </div>
          </div>

          <div className="border border-burnt-orange/60 bg-black/70 p-6 space-y-4 text-sm leading-6 tracking-tight">
            <p className="uppercase tracking-[0.14em] text-burnt-orange font-semibold">
              NEURAL LINK CONSENT // PILOT NOTICE
            </p>
            <p className="text-tech-white/80">
              Connecting to the Nomad Nexus uplink initiates Advocacy-grade telemetry. Proceeding signals your consent to the
              following shipboard data disciplines, logged to encrypted Redscar Databanks under Stanton System Law:
            </p>
            <ul className="space-y-3 text-tech-white/90">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 bg-burnt-orange" aria-hidden />
                <div>
                  <p className="font-semibold uppercase tracking-[0.12em] text-burnt-orange">Biometric Telemetry Collection</p>
                  <p className="text-tech-white/75">
                    Authentication pings confirm command authority. Your biosignature is scanned on each ingress event.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 bg-burnt-orange" aria-hidden />
                <div>
                  <p className="font-semibold uppercase tracking-[0.12em] text-burnt-orange">Quantum Net Cookies</p>
                  <p className="text-tech-white/75">
                    Session management beacons sustain your link during quantum translation. Disablement will terminate active
                    consoles.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 bg-burnt-orange" aria-hidden />
                <div>
                  <p className="font-semibold uppercase tracking-[0.12em] text-burnt-orange">Operational Performance Logging</p>
                  <p className="text-tech-white/75">
                    Maneuvering analytics capture HUD interactions, sensor calls, and reactor load to improve next-flight
                    calibrations.
                  </p>
                </div>
              </li>
            </ul>
            <p className="text-tech-white/70">
              The Advocacy certifies this node complies with UEE data ordinances. Do not proceed if you are not the authorized
              pilot of record.
            </p>
          </div>

          {error && (
            <div className="border border-red-500 bg-red-500/10 text-red-200 px-4 py-3 text-sm tracking-[0.08em]">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading}
              className="px-6 py-3 bg-burnt-orange text-black font-black tracking-[0.22em] uppercase border border-burnt-orange rounded-none hover:bg-orange-500 disabled:opacity-60"
            >
              {loading ? 'CALIBRATING…' : 'AFFIRM PROTOCOL (ACCEPT)'}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="px-6 py-3 border border-red-500 text-red-500 font-semibold tracking-[0.18em] uppercase rounded-none hover:bg-red-500/20"
            >
              SEVER UPLINK (DECLINE)
            </button>
            <div className="text-xs text-tech-white/60 tracking-[0.12em] uppercase">
              Encrypted Redscar Databanks // UEE Compliance Suite
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeurolinkConsent;
