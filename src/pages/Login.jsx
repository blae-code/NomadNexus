import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { syncProfileFromSession } from '@/lib/authSync';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestCallsign, setGuestCallsign] = useState('');
  const [guestRsi, setGuestRsi] = useState('');
  const [guestPersist, setGuestPersist] = useState(false);
  const [showGuestFields, setShowGuestFields] = useState(false);
  const [systemStatus, setSystemStatus] = useState('STANDBY');
  const [rememberMe, setRememberMe] = useState(true);
  const [upgradePrompt, setUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const clearPersistedSession = () => {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-')) localStorage.removeItem(k);
      });
    } catch (e) {
      console.error('Failed to clear persisted session', e);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setSystemStatus('ONLINE'), 500);
    return () => clearTimeout(t);
  }, []);

  // Handle OAuth return (Discord) when code is present in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const errorDescription = url.searchParams.get('error_description');
    if (errorDescription) {
      setError(errorDescription);
      return;
    }
    if (code) {
      (async () => {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message || 'OAuth exchange failed');
            return;
          }
          if (data?.session) {
            await syncProfileFromSession(data.session);
            navigate('/NomadOpsDashboard');
          }
        } catch (err) {
          console.error('OAuth exchange error', err);
          setError(err?.message || 'OAuth exchange failed');
        }
      })();
    }
  }, [navigate]);

  // Detect guest upgrade prompt
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const up = params.get('upgrade');
    if (up) {
      setUpgradePrompt(true);
      setUpgradeReason(
        up === 'guest'
          ? 'Guest session ended. Convert to a permanent Service Record to preserve your footprint.'
          : 'Upgrade to a permanent Service Record.'
      );
    }
  }, []);

  const handleDiscordLogin = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not configured');
      await supabase.auth.signInWithOAuth({
        provider: 'discord',
      });
    } catch (err) {
      console.error('Discord login error', err);
      setError('Discord login failed');
    }
  };

  const handleGuestAccess = async () => {
    setError('');

    // First click reveals the fields, second click submits.
    if (!showGuestFields) {
      setShowGuestFields(true);
      return;
    }

    setGuestLoading(true);
    try {
      if (!supabase) throw new Error('Supabase client not configured');
      if (!guestCallsign.trim() || !guestRsi.trim()) {
        setError('Enter a callsign and RSI handle to continue as guest.');
        setGuestLoading(false);
        return;
      }
      const { data, error: fnError } = await supabase.functions.invoke('create-guest', {
        body: { callsign: guestCallsign.trim(), rsi_handle: guestRsi.trim(), provisional_only: !guestPersist },
      });
      if (fnError || !data?.access_token || !data?.refresh_token) {
        setError(fnError?.message || data?.error || 'Guest access failed');
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (!rememberMe) {
        clearPersistedSession();
      }
      if (guestPersist) {
        navigate('/register?prefill=guest');
      } else {
        navigate('/NomadOpsDashboard');
      }
    } catch (err) {
      console.error('Guest access error', err);
      setError(err?.message || 'Guest access failed');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (!supabase) throw new Error('Supabase client not configured');
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError || !data?.session) {
        setError(signInError?.message || 'Invalid login credentials');
        return;
      }
      await syncProfileFromSession(data.session);
      if (!rememberMe) {
        clearPersistedSession();
      }
      navigate('/NomadOpsDashboard');
    } catch (err) {
      console.error('Login error', err);
      setError(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-black via-slate-950 to-black text-tech-white flex items-center justify-center px-6">
      <div className="login-ambient" />
      <div className="login-veil" />
      <div className="screen-effects pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(204,85,0,0.08),rgba(0,0,0,0.8))]" />

      <div className="relative w-full max-w-xl border border-[var(--burnt-orange)] bg-zinc-950/80 backdrop-blur-md shadow-[0_0_40px_rgba(204,85,0,0.25)] px-10 py-10 space-y-8 overflow-hidden">
        {/* Corner brackets */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[var(--burnt-orange)]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[var(--burnt-orange)]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[var(--burnt-orange)]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[var(--burnt-orange)]" />
        </div>

        <div className="space-y-1 text-center uppercase tracking-[0.28em]">
          <p className="text-xs text-[var(--burnt-orange)]/80">Nomad Nexus // Tactical Gate</p>
          <h1 className="text-2xl font-black text-tech-white">Authentication Interface</h1>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em]">
          <span className="text-zinc-500">System Status</span>
          <span className={systemStatus === 'ONLINE' ? 'text-emerald-400' : 'text-amber-300'}>{systemStatus}</span>
        </div>

        {upgradePrompt && (
          <div className="border border-[var(--burnt-orange)] bg-black/60 px-4 py-3 space-y-2 text-xs font-mono uppercase tracking-[0.15em]">
            <div className="text-[var(--burnt-orange)] font-black">Make Permanent</div>
            <p className="text-tech-white/80 normal-case">{upgradeReason}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => navigate('/register?prefill=guest')}
                className="border border-[var(--burnt-orange)] bg-[var(--burnt-orange)] text-black font-black tracking-[0.2em] rounded-none hover:bg-orange-500"
              >
                Create Service Record
              </Button>
              <Button
                type="button"
                onClick={() => setUpgradePrompt(false)}
                className="border border-zinc-700 bg-zinc-900/60 text-zinc-300 tracking-[0.15em] rounded-none hover:border-[var(--burnt-orange)]"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <div className="border border-[var(--burnt-orange)]/60 bg-black/70 px-4 py-4 text-left space-y-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--burnt-orange)] flex items-center justify-between">
            <span>Fast Lane // Discord SSO</span>
            <span className="text-amber-300 text-[10px]">Preferred</span>
          </div>
          <p className="text-xs text-tech-white/70">
            Link your Redscar Discord credentials to auto-import your callsign and rank. No manual entry required.
          </p>
          <Button
            type="button"
            onClick={handleDiscordLogin}
            className="w-full bg-[#5865F2] text-white font-black tracking-[0.2em] hover:bg-[#4752c4] rounded-none"
          >
            Authenticate via Discord
          </Button>
          <div className="grid grid-cols-1 gap-2 mt-3">
            {showGuestFields && (
              <>
                <Input
                  placeholder="TEMPORARY CALLSIGN"
                  value={guestCallsign}
                  onChange={(e) => setGuestCallsign(e.target.value)}
                  className="bg-zinc-900/50 border-[var(--burnt-orange)]/50 text-tech-white focus:border-[var(--burnt-orange)] uppercase tracking-[0.1em] rounded-none"
                />
                <Input
                  placeholder="RSI HANDLE"
                  value={guestRsi}
                  onChange={(e) => setGuestRsi(e.target.value)}
                  className="bg-zinc-900/50 border-[var(--burnt-orange)]/50 text-tech-white focus:border-[var(--burnt-orange)] uppercase tracking-[0.1em] rounded-none"
                />
              </>
            )}
            <Button
              type="button"
              onClick={handleGuestAccess}
              className="w-full border border-[var(--burnt-orange)] bg-black/60 text-[var(--burnt-orange)] font-black tracking-[0.24em] uppercase hover:bg-[var(--burnt-orange)] hover:text-black rounded-none"
              disabled={guestLoading}
              data-testid="guest-access"
            >
              {guestLoading ? 'Provisioning Guest...' : showGuestFields ? 'Deploy Guest Access' : 'Guest Access (24H Preview)'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-tech-white/80 text-xs uppercase tracking-[0.2em]">Service ID</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="bg-zinc-900/50 border-[var(--burnt-orange)]/50 text-tech-white focus:border-[var(--burnt-orange)] uppercase tracking-[0.12em] rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-tech-white/80 text-xs uppercase tracking-[0.2em]">Encryption Key</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="bg-zinc-900/50 border-[var(--burnt-orange)]/50 text-tech-white focus:border-[var(--burnt-orange)] uppercase tracking-[0.12em] rounded-none"
            />
          </div>

          {error && (
            <div className="border border-red-600 bg-red-900/30 text-red-200 p-3 text-sm font-mono uppercase tracking-[0.12em]">
              Critical Alert: {error}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[var(--burnt-orange)]"
              />
              Remember Me (persist session)
            </label>
          </div>

          <Button type="submit" className="w-full bg-[var(--burnt-orange)] text-black font-black tracking-[0.24em] hover:bg-orange-500 rounded-none" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Enter Nexus'}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="text-center text-[11px] uppercase tracking-[0.2em] text-zinc-500">Or</div>
          <div className="text-center text-xs text-zinc-500">
            New to Redscar?{' '}
            <a href="/register" className="text-[var(--burnt-orange)] hover:text-orange-400 underline underline-offset-4">
              Create a Service Record
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
