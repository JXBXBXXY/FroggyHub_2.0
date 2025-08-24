export type Settings = {
  profile: {
    name: string;
    username: string;
    bio: string;
    links: { site?: string; telegram?: string; instagram?: string };
    locale: 'ru' | 'en';
    publicProfile: boolean;
    avatarUrl?: string;
  };
  notifications: {
    email: { invites: boolean; reminders: boolean; replies: boolean; digest: 'instant' | 'daily' | 'weekly' };
    push: { invites: boolean; hourBefore: boolean };
    quietHours: { start: string; end: string };
  };
  privacy: {
    eventsVisibility: 'public' | 'link_only' | 'private';
    invitesFrom: 'all' | 'friends' | 'none';
    indexingAllowed: boolean;
    showOnline: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accent: 'green' | 'blue' | 'pink' | 'yellow';
    illustrationPack: 'base' | 'summer' | 'winter';
    backgroundPattern: 'none' | 'waves' | 'lilies';
    showMascot: boolean;
  };
  security: {
    twoFA: boolean;
    sessions: Array<{ id: string; device: string; lastActive: string }>;
  };
  integrations: {
    calendar: { icsUrl?: string; google: boolean; apple: boolean };
    webhooks: Array<{ url: string; secret: string }>;
    telegramBot?: { enabled: boolean; username?: string };
  };
};

export const defaultSettings: Settings = {
  profile: {
    name: 'Фродо Бэггинс',
    username: 'frodo',
    bio: '',
    links: {},
    locale: 'ru',
    publicProfile: true,
  },
  notifications: {
    email: { invites: true, reminders: true, replies: true, digest: 'daily' },
    push: { invites: false, hourBefore: false },
    quietHours: { start: '22:00', end: '08:00' },
  },
  privacy: {
    eventsVisibility: 'public',
    invitesFrom: 'all',
    indexingAllowed: true,
    showOnline: true,
  },
  appearance: {
    theme: 'light',
    accent: 'green',
    illustrationPack: 'base',
    backgroundPattern: 'none',
    showMascot: true,
  },
  security: {
    twoFA: false,
    sessions: [],
  },
  integrations: {
    calendar: { google: false, apple: false },
    webhooks: [],
    telegramBot: { enabled: false },
  },
};
