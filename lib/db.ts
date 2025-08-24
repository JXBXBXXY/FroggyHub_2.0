import { Settings, defaultSettings } from './settings';

let settings: Settings = { ...defaultSettings };

export function getSettings(): Settings {
  return settings;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  settings = { ...settings, ...patch };
  return settings;
}
