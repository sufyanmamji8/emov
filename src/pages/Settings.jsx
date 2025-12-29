import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FaArrowLeft, FaShieldAlt, FaLock, FaFileAlt, FaExclamationTriangle, FaQuestionCircle, FaUserShield } from 'react-icons/fa';

// Language translations
const translations = {
  english: {
    settings: "Settings",
    back: "Back",
    security: "Security",
    securityDescription: "Manage your account security and authentication settings",
    privacy: "Privacy",
    privacyDescription: "Control your privacy settings and data sharing preferences",
    policy: "Policy",
    policyDescription: "View our terms of service and privacy policy",
    help: "Help",
    helpDescription: "Get help and support",
    about: "About",
    aboutDescription: "Learn more about Emov",
    account: "Account",
    accountDescription: "Manage your account settings and preferences",
    notifications: "Notifications",
    notificationsDescription: "Control your notification preferences",
    appearance: "Appearance",
    appearanceDescription: "Customize the app appearance",
    language: "Language",
    languageDescription: "Change your preferred language",
    theme: "Theme",
    themeDescription: "Switch between light and dark mode"
  },
  urdu: {
    settings: "ترتیبات",
    back: "پیچھے",
    security: "سیکیورٹی",
    securityDescription: "اپنے اکاؤنٹ سیکیورٹی اور تصدیق کی ترتیبات کریں",
    privacy: "رازداری",
    privacyDescription: "اپنی رازداری کی ترتیبات اور ڈیٹا شیئرنگ کی ترجیحات کنٹرول کریں",
    policy: "پالیسی",
    policyDescription: "ہماری سروس کی شرائط اور رازداری پالیسی دیکھیں",
    help: "مدد",
    helpDescription: "مدد اور سپورٹ حاصل کریں",
    about: "کے بارے میں",
    aboutDescription: "ایموو کے بارے میں زیادہ جانیں",
    account: "کھاتہ",
    accountDescription: "اپنے کھاتے کی ترتیبات اور ترجیحات کریں",
    notifications: "اطلاعات",
    notificationsDescription: "اپنی اطلاعات کی ترجیحات کنٹرول کریں",
    appearance: "ظہر",
    appearanceDescription: "ایپ کی ظاہر کسٹمائز کریں",
    language: "زبان",
    languageDescription: "اپنی پسندیدہ زبان تبدیل کریں",
    theme: "تھیم",
    themeDescription: "لائٹ اور ڈارک موڈ کے درمیان سوئچ کریں"
  },
  french: {
    settings: "Paramètres",
    back: "Retour",
    security: "Sécurité",
    securityDescription: "Gérez les paramètres de sécurité et d'authentification de votre compte",
    privacy: "Confidentialité",
    privacyDescription: "Contrôlez vos paramètres de confidentialité et de partage de données",
    policy: "Politique",
    policyDescription: "Voir nos conditions d'utilisation et politique de confidentialité",
    help: "Aide",
    helpDescription: "Obtenir de l'aide et du support",
    about: "À propos",
    aboutDescription: "En savoir plus sur Emov",
    account: "Compte",
    accountDescription: "Gérez les paramètres et préférences de votre compte",
    notifications: "Notifications",
    notificationsDescription: "Contrôlez vos préférences de notification",
    appearance: "Apparence",
    appearanceDescription: "Personnalisez l'apparence de l'application",
    language: "Langue",
    languageDescription: "Changez votre langue préférée",
    theme: "Thème",
    themeDescription: "Basculer entre le mode clair et sombre"
  }
};

const Settings = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const settingsOptions = [
    {
      id: 'security',
      title: t.security,
      description: t.securityDescription,
      icon: FaShieldAlt,
      color: 'bg-blue-500',
      action: () => console.log('Navigate to Security settings')
    },
    {
      id: 'privacy',
      title: t.privacy,
      description: t.privacyDescription,
      icon: FaLock,
      color: 'bg-purple-500',
      action: () => console.log('Navigate to Privacy settings')
    },
    {
      id: 'policy',
      title: t.policy,
      description: t.policyDescription,
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
      {/* Compact Header with centered heading */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center pt-4 pb-4 sm:pt-6 sm:pb-6 border-b border-border-primary">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-700 dark:text-gray-300 hover:text-emov-purple dark:hover:text-emov-purple transition-colors p-2"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t.settings}</h1>
        </div>
        <div className="w-9"></div> {/* Spacer to balance the layout */}
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
