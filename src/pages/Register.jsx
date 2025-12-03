import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { syntheticEmailFromCallsign, syncProfileFromSession } from '@/lib/authSync';

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
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-black via-slate-900 to-black text-tech-white flex items-center justify-center px-6">
      <div className="login-ambient" />
      <div className="login-veil" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(204,85,0,0.08),rgba(0,0,0,0.75))]" />
      <div className="relative w-full max-w-md border border-burnt-orange bg-black/75 backdrop-blur-lg shadow-[0_0_40px_rgba(204,85,0,0.25)] px-8 py-10 space-y-8">
        <div className="space-y-2 text-center uppercase tracking-[0.25em]">
          <p className="text-xs text-burnt-orange/80">Nomad Nexus</p>
          <h1 className="text-2xl font-black text-tech-white">Nomad Registration</h1>
        </div>
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-tech-white/80 text-xs uppercase tracking-[0.2em]">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="bg-zinc-950 border-burnt-orange/50 text-tech-white focus:border-burnt-orange"
              required
            />
          </div>
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
              minLength={6}
              className="bg-zinc-950 border-burnt-orange/50 text-tech-white focus:border-burnt-orange"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-burnt-orange text-black font-black tracking-[0.2em] hover:bg-orange-500 disabled:opacity-70"
          >
            {isSubmitting ? 'Sequencing...' : 'Initiate Profile'}
          </Button>
          <div className="text-center text-xs text-zinc-500">
            Already linked?{' '}
            <a href="/login" className="text-burnt-orange hover:text-orange-400 underline underline-offset-4">
              Return to Gate
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
