import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt, FaLock, FaFileAlt, FaExclamationTriangle, FaQuestionCircle, FaUserShield } from 'react-icons/fa';

const Settings = () => {
  const navigate = useNavigate();

  const settingsOptions = [
    {
      id: 'security',
      title: 'Security',
      description: 'Manage your account security and authentication settings',
      icon: FaShieldAlt,
      color: 'bg-blue-500',
      action: () => console.log('Navigate to Security settings')
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Control your privacy settings and data sharing preferences',
      icon: FaLock,
      color: 'bg-purple-500',
      action: () => console.log('Navigate to Privacy settings')
    },
    {
      id: 'policy',
      title: 'Policy',
      description: 'View our terms of service and privacy policy',
      icon: FaFileAlt,
      color: 'bg-green-500',
      action: () => console.log('Navigate to Policy settings')
    },
    {
      id: 'report',
      title: 'Report a Problem',
      description: 'Report issues or bugs you encounter while using the app',
      icon: FaExclamationTriangle,
      color: 'bg-orange-500',
      action: () => console.log('Navigate to Report a Problem')
    },
    {
      id: 'alerts',
      title: 'Alerts',
      description: 'Manage your notification preferences and alert settings',
      icon: FaUserShield,
      color: 'bg-red-500',
      action: () => console.log('Navigate to Alerts settings')
    },
    {
      id: 'help',
      title: 'Help and Support',
      description: 'Get help, FAQs, and contact customer support',
      icon: FaQuestionCircle,
      color: 'bg-indigo-500',
      action: () => console.log('Navigate to Help and Support')
    },
    {
      id: 'terms',
      title: 'Terms and Policy',
      description: 'Read our terms of service and privacy policy in detail',
      icon: FaFileAlt,
      color: 'bg-teal-500',
      action: () => console.log('Navigate to Terms and Policy')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Full-width Header with border */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-16 sm:h-20 py-8 border-b border-border-primary">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-700 dark:text-gray-300 hover:text-emov-purple dark:hover:text-emov-purple transition-colors p-2"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={option.action}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 text-left group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${option.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
                    <Icon className={`w-6 h-6 text-${option.color.replace('bg-', '').replace('-500', '-600')} dark:text-${option.color.replace('bg-', '').replace('-500', '-400')}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emov-purple dark:group-hover:text-emov-purple transition-colors">
                      {option.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
                
                {/* Hover Effect */}
                <div className="mt-4 flex items-center text-emov-purple dark:text-emov-purple text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Configure</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About Your Account</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Account Security:</strong> Your account is protected with industry-standard encryption and security measures.
            </p>
            <p>
              <strong>Data Privacy:</strong> We respect your privacy and never share your personal information with third parties without your consent.
            </p>
            <p>
              <strong>Support:</strong> If you need help with any of these settings, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
