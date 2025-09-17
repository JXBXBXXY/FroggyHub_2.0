// netlify/functions/_supabase.js
import { createClient } from '@supabase/supabase-js';

/**
 * Всегда создаём серверный клиент с service-role ключом.
 * Поддерживаем оба имени URL и несколько возможных имён ключа.
 */
export function getServiceClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.PUBLIC_SUPABASE_URL; // на всякий
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || // правильное имя
    process.env.SUPABASE_KEY ||              // на случай других конфигов
    process.env.SERVICE_ROLE_KEY;            // крайний вариант

  if (!url) throw new Error('SUPABASE_URL (or PUBLIC_SUPABASE_URL) is required');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'froggyhub/netlify-fns' } },
  });
}
