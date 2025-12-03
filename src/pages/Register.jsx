import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!supabase) throw new Error('Supabase client not configured');
      const { error: signUpError } = await supabase.auth.signUp({
        email: callsign,
        password,
        options: { data: { full_name: fullName, callsign } },
      });
      if (signUpError) {
        setError('Registration failed');
        return;
      }
      navigate('/login');
    } catch (err) {
      console.error('Registration error', err);
      setError('Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-white">Nomad Ops Registration</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="callsign">Callsign</Label>
            <Input
              id="callsign"
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
