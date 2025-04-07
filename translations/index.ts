import en from './en.json';
import zh from './zh.json';

export const resources = {
  en: {
    translation: en
  },
  zh: {
    translation: zh
  }
} as const;

export type Language = keyof typeof resources;
export type TranslationKey = keyof typeof en;

export { en, zh }; 