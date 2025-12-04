import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import NeurolinkConsent from './NeurolinkConsent';

const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [expiredGuest, setExpiredGuest] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [user, setUser] = useState(null);

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
        const sessionUser = data?.session?.user;
        if (!sessionUser) {
          setAuthed(false);
          return;
        }
        setUser(sessionUser);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_guest, guest_expires_at, tos_accepted_at')
          .eq('id', sessionUser.id)
          .maybeSingle();
        if (profileError) {
          console.warn('Profile fetch failed; allowing session through', profileError);
          setAuthed(true);
          return;
        }
        if (!profile) {
          setAuthed(false);
          return;
        }
        if (profile.is_guest && profile.guest_expires_at && new Date(profile.guest_expires_at) < new Date()) {
          setExpiredGuest(true);
          await supabase.auth.signOut();
          setAuthed(false);
          return;
        }
        const requiresConsent = !profile.is_guest && !profile.tos_accepted_at;
        setShowConsent(requiresConsent);
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

  const handleConsentAccepted = async () => {
    if (!user) return;
    const { data: updatedProfile, error: refreshError } = await supabase
      .from('profiles')
      .select('tos_accepted_at')
      .eq('id', user.id)
      .maybeSingle();
    if (refreshError) {
      console.error('Consent refresh failed', refreshError);
      return;
    }
    setShowConsent(!updatedProfile?.tos_accepted_at);
  };

  if (checking) return null;
  if (expiredGuest) return <Navigate to="/login?upgrade=guest" replace />;
  if (!authed) return <Navigate to="/login" replace />;
  if (showConsent) return <NeurolinkConsent user={user} onAccept={handleConsentAccepted} />;
  return children;
};

export default ProtectedRoute;
