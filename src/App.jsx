import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AgendaPage from './pages/AgendaPage';
import TruckManagementPage from './pages/TruckManagementPage';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';

/**
 * App - Main application entry. Only handles routing and global providers.
 * All business logic and UI are handled in their respective pages/components.
 */
const App = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-100">
        {/* Global navigation bar */}
        <Navbar />
        {/* App routes: each page handles its own logic and UI */}
        <Routes>
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/trucks" element={<TruckManagementPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;