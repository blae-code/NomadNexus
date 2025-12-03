import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [expiredGuest, setExpiredGuest] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!supabase) {
          setAuthed(false);
          setChecking(false);
          return;
        }
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data?.session?.user;
        if (!user) {
          setAuthed(false);
          return;
        }
        // Check guest expiry
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_guest, guest_expires_at')
          .eq('id', user.id)
          .maybeSingle();
        if (profileError) {
          console.error('Profile fetch failed', profileError);
          setAuthed(false);
          return;
        }
        if (profile?.is_guest && profile?.guest_expires_at && new Date(profile.guest_expires_at) < new Date()) {
          setExpiredGuest(true);
          await supabase.auth.signOut();
          setAuthed(false);
          return;
        }
        setAuthed(true);
      } catch (err) {
        console.error('Auth check failed', err);
        setAuthed(false);
      } finally {
        setChecking(false);
      }
    };
    checkSession();
  }, []);

  if (checking) return null;
  if (expiredGuest) return <Navigate to="/login" replace />;
  if (!authed) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
