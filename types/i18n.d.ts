import 'i18next';
import { resources } from '../translations';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof resources;
  }
} 