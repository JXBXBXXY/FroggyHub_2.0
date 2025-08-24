import { z } from "zod";

export const settingsSchema = z.object({
  profile: z.object({
    name: z.string(),
    username: z.string(),
    bio: z.string(),
    links: z.object({
      site: z.string(),
      telegram: z.string(),
      instagram: z.string(),
    }),
    locale: z.enum(["ru", "en"]),
    publicProfile: z.boolean(),
    avatarUrl: z.string(),
  }),
  notifications: z.object({
    email: z.object({
      invites: z.boolean(),
      reminders: z.boolean(),
      replies: z.boolean(),
      digest: z.enum(["instant", "daily", "weekly"]),
    }),
    push: z.object({
      invites: z.boolean(),
      hourBefore: z.boolean(),
    }),
    quietHours: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
  privacy: z.object({
    eventsVisibility: z.enum(["public", "link_only", "private"]),
    invitesFrom: z.enum(["all", "friends", "none"]),
    indexingAllowed: z.boolean(),
    showOnline: z.boolean(),
  }),
  appearance: z.object({
    theme: z.enum(["light", "dark", "system"]),
    accent: z.enum(["green", "blue", "pink", "yellow"]),
    illustrationPack: z.enum(["base", "summer", "winter"]),
    backgroundPattern: z.enum(["none", "waves", "lilies"]),
    showMascot: z.boolean(),
  }),
  security: z.object({
    twoFA: z.boolean(),
    sessions: z.array(z.any()),
  }),
  integrations: z.object({
    calendar: z.object({
      google: z.boolean(),
      apple: z.boolean(),
      icsUrl: z.string().optional(),
    }),
    webhooks: z.array(z.object({ url: z.string(), secret: z.string().optional() })),
    telegramBot: z.object({ enabled: z.boolean() }),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;

