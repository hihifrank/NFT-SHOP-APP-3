import React from 'react';
import {useTranslation} from 'react-i18next';
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AsyncStoragePlugin from 'i18next-react-native-async-storage';

// Import translation files
import enTranslations from '../locales/en.json';
import zhHKTranslations from '../locales/zh-HK.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  'zh-HK': {
    translation: zhHKTranslations,
  },
};

i18n
  .use(AsyncStoragePlugin)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-HK',
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
  });

export const useAppTranslation = () => {
  return useTranslation();
};

export const I18nProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  return <>{children}</>;
};

export default i18n;