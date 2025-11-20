import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from "./pages/ForgetPassword";
import EnterOTP from './pages/EnterOtp';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import FeaturedVehicles from './pages/FeaturedVehicles';
import Service from "./pages/Service";
import Chats from './pages/Chats';
import Ads from './pages/Ads';
import AdDetail from './pages/AdDetail';
import MyAds from './pages/MyAds';
import './index.css'; 


// Create a wrapper component to handle theme
const AppContent = ({ children, isAuthenticated, loading, handleLogin, handleLogout }) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-emov-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/enter-otp" element={<EnterOTP />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<EnterOTP />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" state={{ from: '/dashboard' }} />} 
          />
          <Route path="/vehicles" element={isAuthenticated ? <Vehicles /> : <Navigate to="/login" />} />
          <Route path="/featured-vehicles" element={isAuthenticated ? <FeaturedVehicles /> : <Navigate to="/login" />} />
          <Route path="/service" element={isAuthenticated ? <Service /> : <Navigate to="/login" />} />
          <Route path="/chats" element={isAuthenticated ? <Chats /> : <Navigate to="/login" />} />
          <Route path="/my-ads" element={isAuthenticated ? <Ads /> : <Navigate to="/login" />} />
          <Route path="/my-ads-list" element={isAuthenticated ? <MyAds /> : <Navigate to="/login" />} />
          <Route path="/ad/:adId" element={isAuthenticated ? <AdDetail /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Verify the token is still valid
      try {
        // If you have a token validation endpoint, you can call it here
        // For now, we'll just check if the token exists
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider>
      <ChatProvider>
        <AppContent 
          isAuthenticated={isAuthenticated} 
          loading={loading}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
        />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;