import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Layout from "./Layout.jsx";
import Events from "./Events";
import Channels from "./Channels";
import Treasury from "./Treasury";
import CommsConsole from "./CommsConsole";
import NomadOpsDashboard from "./NomadOpsDashboard";
import Ranks from "./Ranks";
import Profile from "./Profile";
import Admin from "./Admin";
import FleetManager from "./FleetManager";
import MissionControl from "./MissionControl";
import Academy from "./Academy";
import LoginPage from './Login.jsx';
import RegisterPage from './Register.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';

export default function Pages() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<ProtectedRoute><Layout><Navigate to="/NomadOpsDashboard" /></Layout></ProtectedRoute>} />
                <Route path="/Events" element={<ProtectedRoute><Layout><Events /></Layout></ProtectedRoute>} />
                <Route path="/Channels" element={<ProtectedRoute><Layout><Channels /></Layout></ProtectedRoute>} />
                <Route path="/Treasury" element={<ProtectedRoute><Layout><Treasury /></Layout></ProtectedRoute>} />
                <Route path="/CommsConsole" element={<ProtectedRoute><Layout><CommsConsole /></Layout></ProtectedRoute>} />
                <Route path="/NomadOpsDashboard" element={<ProtectedRoute><Layout><NomadOpsDashboard /></Layout></ProtectedRoute>} />
                <Route path="/Ranks" element={<ProtectedRoute><Layout><Ranks /></Layout></ProtectedRoute>} />
                <Route path="/Profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                <Route path="/Admin" element={<ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>} />
                <Route path="/FleetManager" element={<ProtectedRoute><Layout><FleetManager /></Layout></ProtectedRoute>} />
                <Route path="/MissionControl" element={<ProtectedRoute><Layout><MissionControl /></Layout></ProtectedRoute>} />
                <Route path="/Academy" element={<ProtectedRoute><Layout><Academy /></Layout></ProtectedRoute>} />
            </Routes>
        </Router>
    );
}
