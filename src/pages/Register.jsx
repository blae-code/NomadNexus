import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { syncProfileFromSession } from '@/lib/authSync';
import { ChevronRight, AlertTriangle } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [callsign, setCallsign] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (!supabase) throw new Error('Supabase client not configured');
      const emailToUse = email?.trim();
      const { error: signUpError } = await supabase.auth.signUp({
        email: emailToUse,
        password,
        options: { data: { callsign } },
      });
      if (signUpError) {
        setError(signUpError.message || 'Registration failed');
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        await syncProfileFromSession(sessionData.session);
      }
      navigate('/login');
    } catch (err) {
      console.error('Registration error', err);
      setError(err?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-black via-slate-950 to-black text-tech-white flex items-center justify-center px-6 font-mono">
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
          <p className="text-xs text-[var(--burnt-orange)]/80">Nomad Nexus // Intake</p>
          <h1 className="text-2xl font-black text-tech-white">Service Record Initiation</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="callsign" className="text-tech-white/80 text-xs uppercase tracking-[0.2em]">Callsign</Label>
            <Input
              id="callsign"
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              required
              placeholder="ENTER CALLSIGN"
              className="bg-zinc-900/50 border-[var(--burnt-orange)]/50 text-tech-white focus:border-[var(--burnt-orange)] uppercase tracking-[0.12em] rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-tech-white/80 text-xs uppercase tracking-[0.2em]">Service ID (Email)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="NAME@DOMAIN.COM"
              className="bg-zinc-900/50 border-[var(--burnt-orange)]/50 text-tech-white focus:border-[var(--burnt-orange)] uppercase tracking-[0.12em] rounded-none"
              required
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
              minLength={6}
              placeholder="ENTER ENCRYPTION KEY"
              className="bg-zinc-900/50 border-[var(--burnt-orange)]/50 text-tech-white focus:border-[var(--burnt-orange)] uppercase tracking-[0.12em] rounded-none"
            />
          </div>

          {error && (
            <div className="border border-red-600 bg-red-900/30 text-red-200 p-3 text-sm font-mono uppercase tracking-[0.12em] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Critical Alert: {error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--burnt-orange)] text-black font-black tracking-[0.24em] hover:bg-orange-500 disabled:opacity-70 rounded-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Sequencing...' : 'Submit Service Record'}
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="text-center text-xs text-zinc-500">
            Already linked?{' '}
            <a href="/login" className="text-[var(--burnt-orange)] hover:text-orange-400 underline underline-offset-4 uppercase tracking-[0.14em]">
              Return to Gate
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
