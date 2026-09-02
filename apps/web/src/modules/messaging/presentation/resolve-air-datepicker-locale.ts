import type localeEn from 'air-datepicker/locale/en';

import type { LocaleId } from '@/i18n/types';

export type AirDatepickerLocale = typeof localeEn;

type AirLocaleKey =
  | 'ar'
  | 'ca'
  | 'cs'
  | 'da'
  | 'de'
  | 'en'
  | 'es'
  | 'fr'
  | 'hr'
  | 'hu'
  | 'id'
  | 'it'
  | 'ja'
  | 'ko'
  | 'pl'
  | 'pt-BR'
  | 'ru'
  | 'uk'
  | 'zh';

const LOCALE_LOADERS: Record<
  AirLocaleKey,
  () => Promise<AirDatepickerLocale>
> = {
  ar: () => import('air-datepicker/locale/ar').then((m) => m.default),
  ca: () => import('air-datepicker/locale/ca').then((m) => m.default),
  cs: () => import('air-datepicker/locale/cs').then((m) => m.default),
  da: () => import('air-datepicker/locale/da').then((m) => m.default),
  de: () => import('air-datepicker/locale/de').then((m) => m.default),
  en: () => import('air-datepicker/locale/en').then((m) => m.default),
  es: () => import('air-datepicker/locale/es').then((m) => m.default),
  fr: () => import('air-datepicker/locale/fr').then((m) => m.default),
  hr: () => import('air-datepicker/locale/hr').then((m) => m.default),
  hu: () => import('air-datepicker/locale/hu').then((m) => m.default),
  id: () => import('air-datepicker/locale/id').then((m) => m.default),
  it: () => import('air-datepicker/locale/it').then((m) => m.default),
  ja: () => import('air-datepicker/locale/ja').then((m) => m.default),
  ko: () => import('air-datepicker/locale/ko').then((m) => m.default),
  pl: () => import('air-datepicker/locale/pl').then((m) => m.default),
  'pt-BR': () => import('air-datepicker/locale/pt-BR').then((m) => m.default),
  ru: () => import('air-datepicker/locale/ru').then((m) => m.default),
  uk: () => import('air-datepicker/locale/uk').then((m) => m.default),
  zh: () => import('air-datepicker/locale/zh').then((m) => m.default),
};

const WEB_LOCALE_TO_AIR: Record<LocaleId, AirLocaleKey> = {
  'en-US': 'en',
  'id-ID': 'id',
  'ms-MY': 'en',
  'ca-ES': 'ca',
  'cs-CZ': 'cs',
  'da-DK': 'da',
  'de-DE': 'de',
  'et-EE': 'en',
  'es-ES': 'es',
  'fil-PH': 'en',
  'fr-FR': 'fr',
  'hr-HR': 'hr',
  'it-IT': 'it',
  'hu-HU': 'hu',
  'pl-PL': 'pl',
  'pt-BR': 'pt-BR',
  'ru-RU': 'ru',
  'uk-UA': 'uk',
  'ar-SA': 'ar',
  'hi-IN': 'en',
  'ko-KR': 'ko',
  'ja-JP': 'ja',
  'af-ZA': 'en',
  'zh-CN': 'zh',
};

export async function loadAirDatepickerLocale(
  localeId: LocaleId,
): Promise<AirDatepickerLocale> {
  const key = WEB_LOCALE_TO_AIR[localeId] ?? 'en';
  return LOCALE_LOADERS[key]();
}
