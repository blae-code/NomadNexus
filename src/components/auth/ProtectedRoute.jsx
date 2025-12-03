import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

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
        setAuthed(!!data?.session?.user);
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
  if (!authed) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
