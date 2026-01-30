import { tr } from './tr';
import { en } from './en';
import { pt } from './pt';

export type Language = 'tr' | 'en' | 'pt';

export const translations = {
  tr,
  en,
  pt,
} as const;

export type TranslationKey = keyof typeof translations.tr;
