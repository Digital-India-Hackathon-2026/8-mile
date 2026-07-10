import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import Explore from './pages/Explore.jsx';
import ArtisanProfile from './pages/ArtisanProfile.jsx';
import Certificate from './pages/Certificate.jsx';
import Admin from './pages/Admin.jsx';
import Journey from './pages/Journey.jsx';
import Guildmaster from './pages/Guildmaster.jsx';

export default function App() {
  const loc = useLocation();
  // Hide the public Header entirely on the vault route
  const isVault = loc.pathname.startsWith('/guildmaster');

  return (
    <>
      {!isVault && <Header />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Reading is public. Acting requires an account. */}
        <Route path="/discover" element={<Explore personalised={false} />} />
        <Route path="/artisan/:id" element={<ArtisanProfile />} />

        {/* A shared certificate must open for someone with no account, ever. */}
        <Route path="/cert/:code" element={<Certificate />} />

        <Route path="/home" element={<ProtectedRoute><Explore personalised /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        <Route path="/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />

        {/* ═══ HIDDEN ADMIN VAULT ═══ Not linked anywhere. URL only. */}
        <Route path="/guildmaster" element={<Guildmaster />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
