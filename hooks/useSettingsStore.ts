"use client";
import { create } from "zustand";
import type { Settings } from "@/lib/schema";

type State = {
  settings: Settings | null;
  loading: boolean;
  error?: string;
  load: () => Promise<void>;
  save: (patch: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
};

export const useSettingsStore = create<State>((set, get) => ({
  settings: null,
  loading: false,

  load: async () => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      set({ settings: data, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? "load failed", loading: false });
    }
  },

  save: async (patch) => {
    set({ loading: true, error: undefined });
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "save failed");
      set({ settings: data, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? "save failed", loading: false });
    }
  },

  reset: async () => { await get().load(); },
}));

