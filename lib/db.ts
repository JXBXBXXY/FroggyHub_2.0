import { Settings } from "./schema";

export let settings: Settings = {
  profile: { name:"\u041b\u044f\u0433\u0443\u0448\u043e\u043d\u043e\u043a", username:"froggy", bio:"\u041b\u044e\u0431\u043b\u044e \u0432\u0435\u0447\u0435\u0440\u0438\u043d\u043a\u0438 \u0438 \u043a\u0443\u0432\u0448\u0438\u043d\u043a\u0438",
    links:{ site:"", telegram:"", instagram:"" }, locale:"ru", publicProfile:true, avatarUrl:"" },
  notifications: { email:{ invites:true, reminders:true, replies:false, digest:"daily" }, push:{ invites:true, hourBefore:true }, quietHours:{ start:"22:00", end:"08:00" } },
  privacy: { eventsVisibility:"link_only", invitesFrom:"friends", indexingAllowed:false, showOnline:false },
  appearance: { theme:"system", accent:"green", illustrationPack:"base", backgroundPattern:"waves", showMascot:true },
  security: { twoFA:false, sessions:[] },
  integrations: { calendar:{ google:false, apple:false }, webhooks:[], telegramBot:{ enabled:false } }
};

export const getSettings = async () => settings;
export const updateSettings = async (patch: Partial<Settings>) => (settings = { ...settings, ...patch });

