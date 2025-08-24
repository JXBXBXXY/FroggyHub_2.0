'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { t } from '@/lib/i18n';
import { SectionCard } from '@/components/SectionCard';
import { FormRow } from '@/components/FormRow';

const tabs = [
  { id: 'profile', label: t('profile') },
  { id: 'notifications', label: t('notifications') },
  { id: 'privacy', label: t('privacy') },
  { id: 'appearance', label: t('appearance') },
  { id: 'account', label: t('account') },
  { id: 'integrations', label: t('integrations') },
  { id: 'data', label: t('data') },
];

export default function SettingsPage() {
  const search = useSearchParams();
  const router = useRouter();
  const tab = search.get('tab') ?? 'profile';
  const { settings, load, save, reset } = useSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  function setTab(id: string) {
    router.push(`/settings?tab=${id}`, { shallow: true });
  }

  return (
    <div className="md:flex gap-8 p-4">
      <aside className="md:w-60 md:sticky md:top-4 mb-4 md:mb-0">
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`block w-full text-left px-3 py-2 rounded ${tab === t.id ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-500 mb-6">{t('subtitle')}</p>

        {tab === 'profile' && (
          <SectionCard title={t('profile')}>
            <FormRow label="Имя">
              <input
                type="text"
                value={settings.profile.name}
                onChange={(e) => save({ profile: { ...settings.profile, name: e.target.value } })}
                className="w-full border rounded px-2 py-1"
              />
            </FormRow>
            <FormRow label="Юзернейм">
              <input
                type="text"
                value={settings.profile.username}
                onChange={(e) => save({ profile: { ...settings.profile, username: e.target.value } })}
                className="w-full border rounded px-2 py-1"
              />
            </FormRow>
          </SectionCard>
        )}

        {tab === 'notifications' && (
          <SectionCard title={t('notifications')}>
            <p className="text-sm text-gray-500">Секция уведомлений.</p>
          </SectionCard>
        )}

        {tab === 'privacy' && (
          <SectionCard title={t('privacy')}>
            <p className="text-sm text-gray-500">Секция конфиденциальности.</p>
          </SectionCard>
        )}

        {tab === 'appearance' && (
          <SectionCard title={t('appearance')}>
            <p className="text-sm text-gray-500">Секция внешнего вида.</p>
          </SectionCard>
        )}

        {tab === 'account' && (
          <SectionCard title={t('account')}>
            <p className="text-sm text-gray-500">Секция безопасности.</p>
          </SectionCard>
        )}

        {tab === 'integrations' && (
          <SectionCard title={t('integrations')}>
            <p className="text-sm text-gray-500">Секция интеграций.</p>
          </SectionCard>
        )}

        {tab === 'data' && (
          <SectionCard title={t('data')}>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={() => {
                window.location.href = '/api/export';
              }}
            >
              {t('export')}
            </button>
          </SectionCard>
        )}

        <div className="mt-8 flex gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => save(settings)}>
            {t('save')}
          </button>
          <button className="px-4 py-2 border rounded" onClick={() => reset()}>
            {t('reset')}
          </button>
        </div>
      </main>
    </div>
  );
}
