import ru from '@/locales/ru/settings.json';

export type SettingsLocaleKeys = keyof typeof ru;

export function t(key: SettingsLocaleKeys): string {
  return ru[key];
}
