import * as Localization from 'expo-localization';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { en } from './en';
import { es } from './es';
import type { Translations } from './en';

const locales: Record<string, Translations> = { en, es };

function detectLocale(): string {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'en';
  return tag in locales ? tag : 'en';
}

export const locale = detectLocale();

if (locale === 'es') dayjs.locale('es');

export const t: Translations = locales[locale];
