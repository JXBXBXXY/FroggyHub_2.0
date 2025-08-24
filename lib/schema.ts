import { z } from 'zod';

export const linksSchema = z.object({
  site: z.string().url().optional().or(z.literal('')),
  telegram: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
});

export const settingsSchema = z.object({
  profile: z.object({
    name: z.string().min(1),
    username: z.string().regex(/^[a-z0-9_]+$/),
    bio: z.string().max(160),
    links: linksSchema,
    locale: z.enum(['ru', 'en']),
    publicProfile: z.boolean(),
    avatarUrl: z.string().url().optional(),
  }),
  notifications: z.object({
    email: z.object({
      invites: z.boolean(),
      reminders: z.boolean(),
      replies: z.boolean(),
      digest: z.enum(['instant', 'daily', 'weekly']),
    }),
    push: z.object({ invites: z.boolean(), hourBefore: z.boolean() }),
    quietHours: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
  privacy: z.object({
    eventsVisibility: z.enum(['public', 'link_only', 'private']),
    invitesFrom: z.enum(['all', 'friends', 'none']),
    indexingAllowed: z.boolean(),
    showOnline: z.boolean(),
  }),
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    accent: z.enum(['green', 'blue', 'pink', 'yellow']),
    illustrationPack: z.enum(['base', 'summer', 'winter']),
    backgroundPattern: z.enum(['none', 'waves', 'lilies']),
    showMascot: z.boolean(),
  }),
  security: z.object({
    twoFA: z.boolean(),
    sessions: z.array(z.object({
      id: z.string(),
      device: z.string(),
      lastActive: z.string(),
    })),
  }),
  integrations: z.object({
    calendar: z.object({
      icsUrl: z.string().url().optional(),
      google: z.boolean(),
      apple: z.boolean(),
    }),
    webhooks: z.array(z.object({
      url: z.string().url(),
      secret: z.string(),
    })),
    telegramBot: z.object({
      enabled: z.boolean(),
      username: z.string().optional(),
    }).optional(),
  }),
});
