import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      const savedLanguage = localStorage.getItem('language');
      return savedLanguage || 'english';
    } catch {
      return 'english';
    }
  });

  const languages = [
    { value: 'english', label: 'English', flag: '' },
    { value: 'urdu', label: 'اردو', flag: '' },
    { value: 'french', label: 'Français', flag: '' }
  ];

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    try {
      localStorage.setItem('language', newLanguage);
    } catch (error) {
      console.error('Failed to save language to localStorage:', error);
    }
  };

  const currentLanguage = languages.find(lang => lang.value === language);

  const value = {
    language,
    setLanguage: changeLanguage,
    languages,
    currentLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
