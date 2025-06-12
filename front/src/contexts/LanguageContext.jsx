import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage deve ser usado dentro de um LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('pt');

  useEffect(() => {
    // Carregar idioma salvo no localStorage
    const savedLanguage = localStorage.getItem('gameUnite_language');
    if (savedLanguage && ['pt', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Detectar idioma do navegador
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en') {
        setLanguage('en');
      }
    }
  }, []);

  const changeLanguage = (newLanguage) => {
    if (['pt', 'en'].includes(newLanguage)) {
      setLanguage(newLanguage);
      localStorage.setItem('gameUnite_language', newLanguage);
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback para português se a chave não existir
        value = translations.pt;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Retorna a chave se não encontrar tradução
          }
        }
        break;
      }
    }

    // Substituir parâmetros na string
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      Object.keys(params).forEach(param => {
        value = value.replace(`{{${param}}}`, params[param]);
      });
    }

    return value || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isEnglish: language === 'en',
    isPortuguese: language === 'pt'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};