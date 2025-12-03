import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

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

const PageFallback = ({ label }) => (
  <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-xs font-mono uppercase tracking-widest">
    Loading {label}...
  </div>
);

export default function Pages() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
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
            </Routes>
        </Router>
    );
}
