// netlify/functions/events-rsvp.js
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

    // ---- parse & normalize ----
    let body = {};
    try { body = JSON.parse(event.body || '{}'); }
    catch { return json(400, { error: 'Invalid JSON' }); }

    // поддерживаем обе схемы названий
    let event_id = body.event_id ?? null;
    const code = norm(body.code);
    const name = norm(body.name) || norm(body.guest_name);
    const rsvp = normStatus(body.rsvp || body.status);
    const claimItemId = body.claimItemId || null;
    const unclaimItemId = body.unclaimItemId || null;

    // нужна хотя бы одна операция: RSVP или claim/unclaim
    if (!rsvp && !claimItemId && !unclaimItemId) {
      return json(400, { error: 'Nothing to do: provide rsvp or claimItemId/unclaimItemId' });
    }

    // для любых операций по предметам и для RSVP — нужно имя
    if ((rsvp || claimItemId || unclaimItemId) && (!name || name.length < 2)) {
      return json(400, { error: 'guest_name/name is required (min 2 chars)' });
    }

    const sb = getServiceClient();

    // ---- 1) resolve event_id by code/join_code if needed ----
    if (!event_id) {
      if (!code) return json(400, { error: 'event_id or code is required' });

      // сначала ищем по code
      let { data: ev, error: e1 } = await sb
        .from('events')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (e1) return json(500, { error: e1.message });

      // если не нашли — пробуем по join_code (если колонка существует)
      if (!ev) {
        const r2 = await sb
          .from('events')
          .select('id')
          .eq('join_code', code)
          .maybeSingle();

        if (!r2.error) ev = r2.data;
        else {
          const msg = String(r2.error.message || '').toLowerCase();
          const missingCol = msg.includes('column') && (msg.includes('does not exist') || msg.includes('unknown'));
          if (!missingCol) return json(500, { error: r2.error.message });
        }
      }

      if (!ev) return json(404, { error: 'Event not found' });
      event_id = ev.id;
    } else {
      // проверим, что событие существует
      const { data: ev, error: e3 } = await sb.from('events').select('id').eq('id', event_id).maybeSingle();
      if (e3) return json(500, { error: e3.message });
      if (!ev) return json(404, { error: 'Event not found' });
    }

    // ---- 2) RSVP upsert in "guests" (case-insensitive by name) ----
    if (rsvp) {
      const { data: exists, error: exErr } = await sb
        .from('guests')
        .select('id')
        .eq('event_id', event_id)
        .ilike('name', name)
        .maybeSingle();
      if (exErr) return json(500, { error: exErr.message });

      if (exists) {
        const { error: upErr } = await sb.from('guests').update({ rsvp }).eq('id', exists.id);
        if (upErr) return json(500, { error: upErr.message });
      } else {
        const { error: insErr } = await sb.from('guests').insert({ event_id, name, rsvp });
        if (insErr) return json(500, { error: insErr.message });
      }
    }

    // ---- 3) Claim wishlist item ----
    if (claimItemId) {
      // сначала пытаемся вызвать RPC (если настроена)
      const rpcRes = await sb.rpc('claim_wishlist_item', { p_item_id: claimItemId, p_name: name || '' });

      if (rpcRes.error) {
        // Fallback: ручная логика
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
          return json(409, { error: 'Item already claimed by someone else' });
        }
      }
    }

    // ---- 4) Unclaim wishlist item ----
    if (unclaimItemId) {
      // снятие клейма — только тем же именем
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
    console.error('events-rsvp failed', e);
    // 500, а не 200 — чтобы фронт мог различить ошибку
    return json(500, { ok: false, error: e.message || String(e) });
  }
}
