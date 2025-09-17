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
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

    let body = {};
    try { body = JSON.parse(event.body || '{}'); }
    catch { return json(400, { error: 'Invalid JSON' }); }

    // поддерживаем старые и новые имена полей
    let event_id = body.event_id ?? null;
    const code = norm(body.code);
    const name = norm(body.name) || norm(body.guest_name);
    const rsvp = normStatus(body.rsvp || body.status);
    const claimItemId = body.claimItemId ?? null;
    const unclaimItemId = body.unclaimItemId ?? null;

    // нужна хотя бы одна операция
    if (!rsvp && !claimItemId && !unclaimItemId) {
      return json(400, { error: 'Nothing to do: provide rsvp or claimItemId/unclaimItemId' });
    }
    if ((rsvp || claimItemId || unclaimItemId) && (!name || name.length < 2)) {
      return json(400, { error: 'guest_name/name is required (min 2 chars)' });
    }

    const sb = getServiceClient();

    // ---- 1) resolve event_id по code, если нужно ----
    if (!event_id) {
      if (!code) return json(400, { error: 'event_id or code is required' });

      // по code
      let { data: ev, error: e1 } = await sb.from('events').select('id').eq('code', code).maybeSingle();
      if (e1) return json(500, { error: e1.message });

      // по join_code (если колонка есть)
      if (!ev) {
        const r2 = await sb.from('events').select('id').eq('join_code', code).maybeSingle();
        if (!r2.error) ev = r2.data;
        else {
          const m = (r2.error.message || '').toLowerCase();
          const missing = m.includes('column') && (m.includes('does not exist') || m.includes('unknown'));
          if (!missing) return json(500, { error: r2.error.message });
        }
      }
      if (!ev) return json(404, { error: 'Event not found' });
      event_id = ev.id;
    } else {
      const { data: ev, error } = await sb.from('events').select('id').eq('id', event_id).maybeSingle();
      if (error) return json(500, { error: error.message });
      if (!ev) return json(404, { error: 'Event not found' });
    }

    // ---- 2) RSVP (таблица guests; имя без учёта регистра) ----
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

    // ---- 3) Claim wishlist item (claimed_by: TEXT) ----
    if (claimItemId != null) {
      const idNum = Number(claimItemId);
      if (!Number.isFinite(idNum)) return json(400, { error: 'claimItemId must be a number' });

      const { data: item, error: itErr } = await sb
        .from('wishlist_items')
        .select('id, claimed_by')
        .eq('id', idNum)
        .maybeSingle();
      if (itErr) return json(500, { error: itErr.message });
      if (!item) return json(404, { error: 'Item not found' });

      if (!item.claimed_by || sameNames(item.claimed_by, name)) {
        const { error: updErr } = await sb
          .from('wishlist_items')
          .update({ claimed_by: name })
          .eq('id', idNum);
        if (updErr) return json(500, { error: updErr.message });
      } else {
        return json(409, { error: 'Item already claimed by someone else' });
      }
    }

    // ---- 4) Unclaim wishlist item ----
    if (unclaimItemId != null) {
      const idNum = Number(unclaimItemId);
      if (!Number.isFinite(idNum)) return json(400, { error: 'unclaimItemId must be a number' });

      const { data: item, error: itErr } = await sb
        .from('wishlist_items')
        .select('id, claimed_by')
        .eq('id', idNum)
        .maybeSingle();
      if (itErr) return json(500, { error: itErr.message });
      if (!item) return json(404, { error: 'Item not found' });

      if (item.claimed_by && sameNames(item.claimed_by, name)) {
        const { error: clrErr } = await sb
          .from('wishlist_items')
          .update({ claimed_by: null })
          .eq('id', idNum);
        if (clrErr) return json(500, { error: clrErr.message });
      } else {
        return json(403, { error: 'Only claimer can unclaim this item' });
      }
    }

    return json(200, { ok: true });
  } catch (e) {
    console.error('events-rsvp failed', e);
    return json(500, { ok: false, error: e.message || String(e) });
  }
}
