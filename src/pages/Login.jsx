import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { syncProfileFromSession, syntheticEmailFromCallsign } from '@/lib/authSync';

const LoginPage = () => {
  const navigate = useNavigate();
  const [callsign, setCallsign] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!supabase) throw new Error('Supabase client not configured');
      const email = syntheticEmailFromCallsign(callsign);
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !data?.session) {
        setError('Login failed');
        return;
      }
      await syncProfileFromSession(data.session);
      navigate('/');
    } catch (err) {
      console.error('Login error', err);
      setError('Login failed');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-slate-900 to-black text-tech-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl bg-[radial-gradient(circle_at_20%_20%,#cc5500,transparent_25%),radial-gradient(circle_at_80%_30%,#0ea5e9,transparent_20%),radial-gradient(circle_at_50%_80%,#1f2937,transparent_25%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(204,85,0,0.08),rgba(0,0,0,0.75))]" />
      <div className="relative flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-md border border-burnt-orange bg-black/65 backdrop-blur-lg shadow-[0_0_40px_rgba(204,85,0,0.25)] px-8 py-10 space-y-8">
          <div className="space-y-2 text-center uppercase tracking-[0.25em]">
            <p className="text-xs text-burnt-orange/80">Nomad Nexus</p>
            <h1 className="text-2xl font-black text-tech-white">Authentication Gate</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="callsign" className="text-tech-white/80 text-xs uppercase tracking-[0.2em]">Callsign</Label>
              <Input
                id="callsign"
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
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
            <Button type="submit" className="w-full bg-burnt-orange text-black font-black tracking-[0.2em] hover:bg-orange-500">
              Enter Nexus
            </Button>
          </form>
          <div className="space-y-3">
            <div className="text-center text-[11px] uppercase tracking-[0.2em] text-zinc-500">Or</div>
            <Button
              type="button"
              onClick={handleDiscordLogin}
              className="w-full bg-[#5865F2] text-white font-black tracking-[0.2em] hover:bg-[#4752c4]"
            >
              Link Discord Access
            </Button>
            <div className="text-center text-xs text-zinc-500">
              New to Redscar?{' '}
              <a href="/register" className="text-burnt-orange hover:text-orange-400 underline underline-offset-4">
                Create a Service Record
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
