// GET /.netlify/functions/db-url-check
// Парсит DATABASE_URL и возвращает отдельные поля (без пароля), чтобы проверить корректность значения.
export default async function handler() {
  const raw = process.env.DATABASE_URL || '';
  if (!raw) {
    return new Response(JSON.stringify({ ok:false, error:'DATABASE_URL is not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
  try {
    const u = new URL(raw);
    const masked = raw.replace(/:(.*?)@/, ':***@');
    return new Response(JSON.stringify({
      ok: true,
      masked,                // для визуальной проверки
      protocol: u.protocol,  // должно быть "postgres:" или "postgresql:"
      host: u.hostname,      // должен выглядеть как *.neon.tech (или *.supabase.co)
      port: u.port || '5432',
      database: u.pathname.replace(/^\//,''),
      user: decodeURIComponent(u.username),
      hasPassword: Boolean(u.password),
      search: u.search       // должен содержать ?sslmode=require (или &sslmode=require)
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: String(e) }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
}
