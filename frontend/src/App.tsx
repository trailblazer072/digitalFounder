import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardLayout from './layouts/DashboardLayout';
import ChatInterface from './pages/ChatInterface';
import AssetsLibrary from './pages/AssetsLibrary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/setup" element={<OnboardingPage />} />

        {/* Main App Routes */}
        <Route path="/app" element={<DashboardLayout />}>
          <Route path="agent/:agentId" element={<ChatInterface />} />
          <Route path="assets" element={<AssetsLibrary />} />
          {/* Default redirect or instructions */}
          <Route path="" element={<div className="flex h-full items-center justify-center text-slate-500">Select an agent to start</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
