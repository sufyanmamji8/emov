import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FaCar } from 'react-icons/fa';
import { ToastContainer } from './utils/toast.jsx';
import toast from './utils/toast.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
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
import FilteredVehicles from './pages/FilteredVehicles';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import More from './pages/More';

import 'react-toastify/dist/ReactToastify.css';
import './index.css'; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
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

  const handleLogout = (navigate) => {
    // Show toast with explicit options
    const toastId = toast.success('Signed Out', {
      autoClose: 2000,
      closeOnClick: true,
      pauseOnHover: false,
    });
    
    // Clear authentication data and redirect after toast duration
    setTimeout(() => {
      // Force close any remaining toasts
      toast.dismiss();
      
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      
      // Navigate to home page, not login
      navigate('/');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-secondary">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emov-purple"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <FaCar className="w-6 h-6 text-emov-purple" />
          </div>
        </div>
        <p className="mt-6 text-text-primary font-medium text-lg">Loading vehicles...</p>
        <p className="mt-2 text-text-secondary text-sm">Please wait a moment</p>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <ChatProvider>
            <AppRoutes 
              isAuthenticated={isAuthenticated}
              handleLogin={handleLogin}
              handleLogout={handleLogout}
            />
            <ToastContainer />
          </ChatProvider>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

// Separate component for routes to use useNavigate hook
function AppRoutes({ isAuthenticated, handleLogin, handleLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/enter-otp" element={<EnterOTP />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route 
          path="/dashboard" 
          element={<Dashboard handleLogout={() => handleLogout(navigate)} />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" state={{ from: '/profile' }} />} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" state={{ from: '/settings' }} />} 
        />
        <Route 
          path="/more" 
          element={isAuthenticated ? <More handleLogout={() => handleLogout(navigate)} /> : <Navigate to="/login" state={{ from: '/more' }} />} 
        />
        <Route path="/vehicles" element={<Vehicles />} />

        {/* FIXED ROUTES - Single route with parameters */}
        <Route path="/vehicles/:filterType/:filterId" element={<FilteredVehicles />} />
        
        <Route path="/featured-vehicles" element={isAuthenticated ? <FeaturedVehicles /> : <Navigate to="/login" />} />
        <Route path="/service" element={isAuthenticated ? <Service /> : <Navigate to="/login" />} />
        <Route path="/chats" element={isAuthenticated ? <Chats /> : <Navigate to="/login" />} />
        <Route path="/my-ads" element={isAuthenticated ? <Ads /> : <Navigate to="/login" />} />
        <Route path="/my-ads-list" element={isAuthenticated ? <MyAds /> : <Navigate to="/login" />} />
        <Route path="/ad/:adId" element={isAuthenticated ? <AdDetail /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;