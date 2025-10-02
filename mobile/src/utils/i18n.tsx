import React, {createContext, useContext, useEffect} from 'react';
import i18n from 'i18next';
import {initReactI18next, useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAppSelector, useAppDispatch} from '@store/index';
import {setLanguage} from '@store/slices/userSlice';

// Import translation files
import zhHK from '../locales/zh-HK.json';
import zhCN from '../locales/zh-CN.json';
import en from '../locales/en.json';

const LANGUAGE_STORAGE_KEY = 'user_language';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-HK': {
        translation: zhHK,
      },
      'zh-CN': {
        translation: zhCN,
      },
      en: {
        translation: en,
      },
    },
    lng: 'zh-HK', // default language
    fallbackLng: 'zh-HK',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

interface I18nContextType {
  changeLanguage: (language: string) => Promise<void>;
  currentLanguage: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(state => state.user.profile?.preferredLanguage || 'zh-HK');

  useEffect(() => {
    // Load saved language on app start
    loadSavedLanguage();
  }, []);

  useEffect(() => {
    // Update i18n when language changes in store
    i18n.changeLanguage(currentLanguage);
  }, [currentLanguage]);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && ['zh-HK', 'zh-CN', 'en'].includes(savedLanguage)) {
        dispatch(setLanguage(savedLanguage as 'zh-HK' | 'zh-CN' | 'en'));
      }
    } catch (error) {
      console.error('Failed to load saved language:', error);
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      dispatch(setLanguage(language as 'zh-HK' | 'zh-CN' | 'en'));
      await i18n.changeLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const contextValue: I18nContextType = {
    changeLanguage,
    currentLanguage,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

// Custom hook that combines react-i18next with our context
export const useAppTranslation = () => {
  const {t, i18n: i18nInstance} = useTranslation();
  const {changeLanguage, currentLanguage} = useI18n();

  return {
    t,
    changeLanguage,
    currentLanguage,
    isRTL: i18nInstance.dir() === 'rtl',
  };
};