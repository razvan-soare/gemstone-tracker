import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../translations';

export function useLanguage() {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language as Language;
  
  const changeLanguage = useCallback(async (language: Language) => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }, [i18n]);

  const isRTL = i18n.dir() === 'rtl';

  const availableLanguages: { code: Language; name: string }[] = [
    { code: 'en', name: t('settings.language.english') },
    { code: 'zh', name: t('settings.language.chinese') },
  ];

  return {
    t,
    currentLanguage,
    changeLanguage,
    isRTL,
    availableLanguages,
  };
} 