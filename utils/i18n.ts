import en from '../locales/en.json';
import es from '../locales/es.json';

export type Locale = 'en' | 'es';

const dictionaries: Record<Locale, Record<string, any>> = {
  en,
  es
};

type TemplateVars = Record<string, string | number>;

const getValue = (locale: Locale, key: string) => {
  const parts = key.split('.');
  let current: any = dictionaries[locale] || dictionaries.en;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
};

export const t = (locale: Locale, key: string, vars?: TemplateVars) => {
  const raw = getValue(locale, key) ?? getValue('en', key) ?? key;
  if (typeof raw !== 'string') return key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => {
    const value = vars[name];
    return value === undefined ? `{${name}}` : String(value);
  });
};
