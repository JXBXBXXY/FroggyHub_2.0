'use client';

import { create } from 'zustand';
import { Settings, defaultSettings } from '@/lib/settings';
import { t } from '@/lib/i18n';

interface State {
  settings: Settings;
  load: () => Promise<void>;
  save: (patch: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<State>((set, get) => ({
  settings: defaultSettings,
  async load() {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      set({ settings: data });
    }
  },
  async save(patch) {
    const current = get().settings;
    set({ settings: { ...current, ...patch } });
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      console.error(t('error'));
    } else {
      const data = await res.json();
      set({ settings: data });
    }
  },
  async reset() {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      set({ settings: data });
    }
  },
}));
