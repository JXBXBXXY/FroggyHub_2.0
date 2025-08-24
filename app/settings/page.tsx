"use client";

import { useEffect, useId, useState } from "react";
import { useSettingsStore } from "@/hooks/useSettingsStore";

// \u041c\u0438\u043d\u0438-\u043a\u043e\u043c\u043f\u043e\u043d\u0435\u043d\u0442\u044b Toggle, Hint, Field, TextAreaField (\u0432\u0441\u0442\u0440\u043e\u0435\u043d\u044b \u043f\u0440\u044f\u043c\u043e \u0437\u0434\u0435\u0441\u044c)
function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  const uid = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={uid} className="font-medium text-white">{label}</label>
        {desc && <p className="text-sm text-white/70">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-emerald-500" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-white/70">{children}</p>;
}
function Field({ label, placeholder, defaultValue, onBlur }: { label: string; placeholder?: string; defaultValue?: string; onBlur?: (v: string) => void }) {
  const [value, setValue] = useState(defaultValue || "");
  return (
    <label className="block py-2">
      <span className="block text-sm text-white/80 mb-1">{label}</span>
      <input className="w-full rounded-lg bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
        placeholder={placeholder} defaultValue={defaultValue} onChange={(e) => setValue(e.target.value)} onBlur={(e) => onBlur?.(e.target.value)} />
    </label>
  );
}
function TextAreaField({ label, placeholder, defaultValue, onBlur }: { label: string; placeholder?: string; defaultValue?: string; onBlur?: (v: string) => void }) {
  const [value, setValue] = useState(defaultValue || "");
  return (
    <label className="block py-2">
      <span className="block text-sm text-white/80 mb-1">{label}</span>
      <textarea className="w-full min-h-[96px] rounded-lg bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
        placeholder={placeholder} defaultValue={defaultValue} onChange={(e) => setValue(e.target.value)} onBlur={(e) => onBlur?.(e.target.value)} />
    </label>
  );
}

export default function SettingsPage() {
  const { settings, load, save, loading, error } = useSettingsStore();
  useEffect(() => { load(); }, [load]);

  if (!settings && loading) return <main className="p-8 text-white">\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438\u2026 \uD83D\uDC38</main>;
  if (!settings) return null;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 text-white">
      <h1 className="text-3xl font-semibold mb-6">\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438</h1>

      {/* \u041f\u0440\u043e\u0444\u0438\u043b\u044c */}
      <section className="mb-10 bg-white/5 p-5 rounded-2xl">
        <h2 className="mb-2 text-xl font-semibold">\u041f\u0440\u043e\u0444\u0438\u043b\u044c</h2>
        <Hint>\u0420\u0430\u0441\u0441\u043a\u0430\u0436\u0438 \u043e \u0441\u0435\u0431\u0435 \u2014 \u0438 \u0434\u0440\u0443\u0437\u044c\u044f \u0431\u044b\u0441\u0442\u0440\u0435\u0435 \u043f\u043e\u0439\u043c\u0443\u0442, \u043a\u0443\u0434\u0430 \u0442\u0435\u0431\u044f \u0437\u0432\u0430\u0442\u044c.</Hint>
        <Field label="\u0418\u043c\u044f" defaultValue={settings.profile.name} onBlur={(v) => save({ profile: { ...settings.profile, name: v } })} placeholder="\u041b\u044f\u0433\u0443\u0448\u043e\u043d\u043e\u043a \u0421\u0435\u043c\u0451\u043d" />
        <Field label="\u042e\u0437\u0435\u0440\u043d\u0435\u0439\u043c" defaultValue={settings.profile.username} onBlur={(v) => save({ profile: { ...settings.profile, username: v } })} placeholder="froggy_master" />
        <TextAreaField label="\u041e \u0441\u0435\u0431\u0435" defaultValue={settings.profile.bio} onBlur={(v) => save({ profile: { ...settings.profile, bio: v } })} placeholder="\u041b\u044e\u0431\u043b\u044e \u0432\u0435\u0447\u0435\u0440\u0438\u043d\u043a\u0438 \u0438 \u043a\u0443\u0432\u0448\u0438\u043d\u043a\u0438." />
      </section>

      {/* \u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f */}
      <section className="mb-10 bg-white/5 p-5 rounded-2xl">
        <h2 className="mb-2 text-xl font-semibold">\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f</h2>
        <Toggle checked={settings.notifications.email.invites} onChange={(v) => save({ notifications: { ...settings.notifications, email: { ...settings.notifications.email, invites: v } } })} label="\u041f\u0438\u0441\u044c\u043c\u0430 \u043e \u043f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u044f\u0445" desc="\u041a\u043e\u0433\u0434\u0430 \u0434\u0440\u0443\u0437\u044c\u044f \u0437\u043e\u0432\u0443\u0442 \u2014 \u043b\u0443\u0447\u0448\u0435 \u0443\u0437\u043d\u0430\u0442\u044c \u043e\u0431 \u044d\u0442\u043e\u043c." />
        <Toggle checked={settings.notifications.email.reminders} onChange={(v) => save({ notifications: { ...settings.notifications, email: { ...settings.notifications.email, reminders: v } } })} label="\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f \u043e \u0441\u043e\u0431\u044b\u0442\u0438\u044f\u0445" desc="\u0417\u0430 \u0447\u0430\u0441 \u0434\u043e \u0442\u0443\u0441\u043e\u0432\u043a\u0438 \u2014 \u0441\u0430\u043c\u043e\u0435 \u0442\u043e." />
      </section>

      {/* \u041a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c */}
      <section className="mb-10 bg-white/5 p-5 rounded-2xl">
        <h2 className="mb-2 text-xl font-semibold">\u041a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c</h2>
        <Toggle checked={settings.privacy.showOnline} onChange={(v) => save({ privacy: { ...settings.privacy, showOnline: v } })} label="\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u043e\u043d\u043b\u0430\u0439\u043d-\u0441\u0442\u0430\u0442\u0443\u0441" desc="\u041c\u043e\u0436\u043d\u043e \u0441\u043f\u0440\u044f\u0442\u0430\u0442\u044c\u0441\u044f, \u043d\u043e \u0434\u0440\u0443\u0437\u044c\u044f \u0431\u0443\u0434\u0443\u0442 \u0433\u0430\u0434\u0430\u0442\u044c: \u0441\u043f\u0438\u0448\u044c \u0438\u043b\u0438 \u043a\u0432\u0430\u043a\u0430\u0435\u0448\u044c." />
      </section>

      {/* \u0412\u043d\u0435\u0448\u043d\u0438\u0439 \u0432\u0438\u0434 */}
      <section className="mb-10 bg-white/5 p-5 rounded-2xl">
        <h2 className="mb-2 text-xl font-semibold">\u0412\u043d\u0435\u0448\u043d\u0438\u0439 \u0432\u0438\u0434</h2>
        <Field label="\u0422\u0435\u043c\u0430" defaultValue={settings.appearance.theme} onBlur={(v) => save({ appearance: { ...settings.appearance, theme: v as any } })} placeholder="light / dark / system" />
      </section>

      {/* \u0414\u0430\u043d\u043d\u044b\u0435 */}
      <section className="mb-10 bg-white/5 p-5 rounded-2xl">
        <h2 className="mb-2 text-xl font-semibold">\u0414\u0430\u043d\u043d\u044b\u0435</h2>
        <a href="/api/export" className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500">\u042d\u043a\u0441\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043c\u043e\u0438 \u0434\u0430\u043d\u043d\u044b\u0435 (JSON)</a>
      </section>

      <footer className="mt-6 text-sm text-white/60">
        {loading ? "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c\u2026 \uD83D\uDCBE" : "\u0412\u0441\u0435 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044F \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b. \u041c\u043e\u0436\u043d\u043e \u043f\u043b\u044f\u0441\u0430\u0442\u044c."}
        {error && <span className="ml-2 text-red-300">\u041e\u0448\u0438\u0431\u043a\u0430: {error}</span>}
      </footer>
    </main>
  );
}

