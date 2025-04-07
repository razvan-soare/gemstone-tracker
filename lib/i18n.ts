import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';

// Language detection plugins
import LanguageDetector from 'i18next-browser-languagedetector';

// Translations
import { resources } from '../translations';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get stored language from AsyncStorage
      const storedLanguage = await AsyncStorage.getItem('user-language');
      
      if (storedLanguage) {
        return callback(storedLanguage);
      } 
      
      // If no language is stored, use device language on native platforms
      // or use language detector in web environment
      if (Platform.OS !== 'web') {
        const deviceLanguage = Localization.getLocales()[0]?.languageCode;
        return callback(deviceLanguage || 'en');
      }
    } catch (error) {
      console.error('Error detecting language:', error);
    }
    
    // Fallback to English
    callback('en');
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  }
};

// Initialize i18next
i18n
  // Use language detector for web
  .use(Platform.OS === 'web' ? LanguageDetector : LANGUAGE_DETECTOR)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    compatibilityJSON: 'v3', // Required for Android
    resources,
    // Default language
    fallbackLng: 'en',
    
    // Debug mode in development
    debug: __DEV__,
    
    // Default namespace used
    defaultNS: 'translation',
    
    // Supports keys with dots
    keySeparator: '.',
    
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false, // Prevent suspense in SSR
    },
  });

export default i18n; 