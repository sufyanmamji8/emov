import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function Ads() {
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">My Ads</h1>
        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <p className="text-center text-gray-500">Your ads will appear here</p>
        </div>
      </div>
    </div>
  );
}
