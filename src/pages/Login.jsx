import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { syncProfileFromSession, syntheticEmailFromCallsign } from '@/lib/authSync';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestCallsign, setGuestCallsign] = useState('');
  const [guestRsi, setGuestRsi] = useState('');
  const [guestPersist, setGuestPersist] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDiscordLogin = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not configured');
      await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo: window.location.origin },
      });
    } catch (err) {
      console.error('Discord login error', err);
      setError('Discord login failed');
    }
  };

  const handleGuestAccess = async () => {
    setError('');
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
      if (guestPersist) {
        // If they opted to make it permanent, route them straight to registration to finalize.
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
      navigate('/NomadOpsDashboard');
    } catch (err) {
      console.error('Login error', err);
      setError(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-black via-slate-900 to-black text-tech-white flex items-center justify-center px-6">
      <div className="login-ambient" />
      <div className="login-veil" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(204,85,0,0.08),rgba(0,0,0,0.75))]" />
      <div className="relative w-full max-w-md border border-burnt-orange bg-black/75 backdrop-blur-lg shadow-[0_0_40px_rgba(204,85,0,0.25)] px-8 py-10 space-y-8">
        <div className="space-y-2 text-center uppercase tracking-[0.25em]">
          <p className="text-xs text-burnt-orange/80">Nomad Nexus</p>
          <h1 className="text-2xl font-black text-tech-white">Authentication Gate</h1>
        </div>

        <div className="border border-burnt-orange/60 bg-black/60 px-4 py-3 text-left space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-burnt-orange flex items-center justify-between">
            <span>Fast Lane // Discord SSO</span>
            <span className="text-amber-300 text-[10px]">Preferred</span>
          </div>
          <p className="text-xs text-tech-white/70">
            Link your Redscar Discord credentials to auto-import your callsign and rank. No manual entry required.
          </p>
          <Button
            type="button"
            onClick={handleDiscordLogin}
            className="w-full bg-[#5865F2] text-white font-black tracking-[0.2em] hover:bg-[#4752c4]"
          >
            Authenticate via Discord
          </Button>
          <div className="grid grid-cols-1 gap-2 mt-3">
            <Input
              placeholder="Temporary Callsign"
              value={guestCallsign}
              onChange={(e) => setGuestCallsign(e.target.value)}
              className="bg-zinc-950 border-burnt-orange/50 text-tech-white focus:border-burnt-orange"
            />
            <Input
              placeholder="RSI Handle"
              value={guestRsi}
              onChange={(e) => setGuestRsi(e.target.value)}
              className="bg-zinc-950 border-burnt-orange/50 text-tech-white focus:border-burnt-orange"
            />
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-zinc-400">
              <input
                type="checkbox"
                checked={guestPersist}
                onChange={(e) => setGuestPersist(e.target.checked)}
                className="accent-burnt-orange"
              />
              Make this permanent (takes you to registration)
            </label>
            <Button
              type="button"
              onClick={handleGuestAccess}
              className="w-full border border-burnt-orange text-burnt-orange font-black tracking-[0.2em] hover:bg-burnt-orange hover:text-black"
              disabled={guestLoading}
              data-testid="guest-access"
            >
              {guestLoading ? 'Provisioning Guest...' : 'Guest Access (24h Preview)'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-tech-white/80 text-xs uppercase tracking-[0.2em]">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-zinc-950 border-burnt-orange/50 text-tech-white focus:border-burnt-orange"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-tech-white/80 text-xs uppercase tracking-[0.2em]">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-950 border-burnt-orange/50 text-tech-white focus:border-burnt-orange"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full bg-burnt-orange text-black font-black tracking-[0.2em] hover:bg-orange-500" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Enter Nexus'}
          </Button>
        </form>
        <div className="space-y-3">
          <div className="text-center text-[11px] uppercase tracking-[0.2em] text-zinc-500">Or</div>
          <div className="text-center text-xs text-zinc-500">
            New to Redscar?{' '}
            <a href="/register" className="text-burnt-orange hover:text-orange-400 underline underline-offset-4">
              Create a Service Record
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
