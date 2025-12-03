import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

import Layout from "./Layout.jsx";
import Events from "./Events";
import Channels from "./Channels";
import Treasury from "./Treasury";
import Ranks from "./Ranks";
import Profile from "./Profile";
import FleetManager from "./FleetManager";
import MissionControl from "./MissionControl";
import LoginPage from './Login.jsx';
import RegisterPage from './Register.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';

const CommsConsole = lazy(() => import('./CommsConsole'));
const NomadOpsDashboard = lazy(() => import('./NomadOpsDashboard'));
const Admin = lazy(() => import('./Admin'));
const Academy = lazy(() => import('./Academy'));
const NomadNexusShell = lazy(() => import('./NomadNexusShell'));
const NomadNexusShellMk2 = lazy(() => import('./NomadNexusShell_Mk2'));

const PageFallback = ({ label }) => (
  <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-xs font-mono uppercase tracking-widest">
    Loading {label}...
  </div>
);

const AuthCallback = () => {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token && supabase) {
      supabase.auth.setSession({ access_token, refresh_token })
        .catch((err) => console.error('Auth callback error', err))
        .finally(() => {
          window.location.replace('/login');
        });
    } else {
      window.location.replace('/login');
    }
  }, []);
  return null;
};

export default function Pages() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Navigate to="/NomadOpsDashboard" />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/Events" element={<ProtectedRoute><Layout><Events /></Layout></ProtectedRoute>} />
                <Route path="/Channels" element={<ProtectedRoute><Layout><Channels /></Layout></ProtectedRoute>} />
                <Route path="/Treasury" element={<ProtectedRoute><Layout><Treasury /></Layout></ProtectedRoute>} />
                <Route
                  path="/CommsConsole"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<PageFallback label="Comms Console" />}>
                          <CommsConsole />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/NomadOpsDashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<PageFallback label="Nomad Ops" />}>
                          <NomadOpsDashboard />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/Ranks" element={<ProtectedRoute><Layout><Ranks /></Layout></ProtectedRoute>} />
                <Route path="/Profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                <Route
                  path="/Admin"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<PageFallback label="Admin" />}>
                          <Admin />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/FleetManager" element={<ProtectedRoute><Layout><FleetManager /></Layout></ProtectedRoute>} />
                <Route path="/MissionControl" element={<ProtectedRoute><Layout><MissionControl /></Layout></ProtectedRoute>} />
                <Route
                  path="/Academy"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<PageFallback label="Academy" />}>
                          <Academy />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/NexusShell"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<PageFallback label="Nexus Shell" />}>
                          <NomadNexusShell />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/NexusShellMk2"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<PageFallback label="Nexus Shell Mk2" />}>
                          <NomadNexusShellMk2 />
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
            </Routes>
        </Router>
    );
}
