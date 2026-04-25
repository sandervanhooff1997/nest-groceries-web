import { translations, type TranslationKey } from './translations';

export function useTranslations() {
  return {
    t: (key: TranslationKey): string => translations[key],
  };
}
