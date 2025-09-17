// netlify/functions/<ТВОЙ_ФАЙЛ>.js
import { getServiceClient } from './_supabase.js';

/* ---------- helpers ---------- */
const cors = () => ({
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
});
const json = (status, body) => ({ statusCode: status, headers: cors(), body: JSON.stringify(body) });

const norm = (v) => (typeof v === 'string' ? v.trim() : v ?? null);
const normStatus = (v) => {
  const s = String(v || '').trim().toLowerCase();
  return ['yes', 'maybe', 'no'].includes(s) ? s : null;
};
const sameNames = (a = '', b = '') => a.trim().toLowerCase() === b.trim().toLowerCase();

/* ---------- handler ---------- */
export async function handler(event) {
  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

    let body = {};
    try { body = JSON.parse(event.body || '{}'); }
    catch { return json(400, { error: 'Invalid JSON' }); }

    const code = norm(body.code);
    const name = norm(body.name);
    const rsvp = normStatus(body.rsvp);
    const claimItemId = body.claimItemId || null;
    const unclaimItemId = body.unclaimItemId || null;

    if (!code) return json(400, { error: 'code required' });

    const sb = getServiceClient();

    // --- 1) Ищем событие по code или join_code ---
    let ev = null;
    {
      const r1 = await sb.from('events').select('id, code, join_code').eq('code', code).maybeSingle();
      if (r1.error) return json(500, { error: r1.error.message });
      ev = r1.data;

      // если не нашли — пробуем по join_code (колонка может не существовать в схеме: игнорируем такую ошибку)
      if (!ev) {
        const r2 = await sb.from('events').select('id, code, join_code').eq('join_code', code).maybeSingle();
        if (r2.error) {
          const msg = String(r2.error.message || '').toLowerCase();
          const missingCol = msg.includes('column') && (msg.includes('does not exist') || msg.includes('unknown'));
          if (!missingCol) return json(500, { error: r2.error.message });
        } else {
          ev = r2.data;
        }
      }
    }
    if (!ev) return json(404, { error: 'Event not found' });

    // --- 2) Upsert гостя, если пришли name + rsvp ---
    if (name && rsvp) {
      // пробуем найти по ILIKE (регистронезависимо)
      const { data: exists, error: exErr } = await sb
        .from('guests')
        .select('id')
        .eq('event_id', ev.id)
        .ilike('name', name)
        .maybeSingle();

      if (exErr) return json(500, { error: exErr.message });

      if (exists) {
        const { error: upErr } = await sb.from('guests').update({ rsvp }).eq('id', exists.id);
        if (upErr) return json(500, { error: upErr.message });
      } else {
        const { error: insErr } = await sb.from('guests').insert({ event_id: ev.id, name, rsvp });
        if (insErr) return json(500, { error: insErr.message });
      }
    }

    // --- 3) Клейм предмета из вишлиста ---
    if (claimItemId) {
      // сначала попытаемся вызвать RPC (если есть)
      const rpcRes = await sb.rpc('claim_wishlist_item', { p_item_id: claimItemId, p_name: name || '' });

      if (rpcRes.error) {
        // fallback: вручную
        const { data: item, error: itErr } = await sb
          .from('wishlist_items')
          .select('id, claimed_by')
          .eq('id', claimItemId)
          .maybeSingle();
        if (itErr) return json(500, { error: itErr.message });
        if (!item) return json(404, { error: 'Item not found' });

        // можно занять, если свободно или уже занято этим же именем
        if (!item.claimed_by || sameNames(item.claimed_by, name || '')) {
          const { error: updErr } = await sb
            .from('wishlist_items')
            .update({ claimed_by: name || null })
            .eq('id', claimItemId);
          if (updErr) return json(500, { error: updErr.message });
        } else {
          // занято другим
          return json(409, { error: 'Item already claimed by someone else' });
        }
      }
    }

    // --- 4) Снять клейм ---
    if (unclaimItemId) {
      // разрешаем снимать только тому, кто держит предмет (по имени, регистр игнорируем)
      const { data: item, error: itErr } = await sb
        .from('wishlist_items')
        .select('id, claimed_by')
        .eq('id', unclaimItemId)
        .maybeSingle();
      if (itErr) return json(500, { error: itErr.message });
      if (!item) return json(404, { error: 'Item not found' });

      if (item.claimed_by && sameNames(item.claimed_by, name || '')) {
        const { error: clrErr } = await sb
          .from('wishlist_items')
          .update({ claimed_by: null })
          .eq('id', unclaimItemId);
        if (clrErr) return json(500, { error: clrErr.message });
      } else {
        return json(403, { error: 'Only claimer can unclaim this item' });
      }
    }

    return json(200, { ok: true });
  } catch (e) {
    console.error('join/rsvp failed', e);
    // 500, а не 200 — чтобы фронт мог различить ошибку
    return json(500, { ok: false, error: e.message || String(e) });
  }
}
