import jwt from 'jsonwebtoken';
import { json, preflight, corsHeaders } from './_http.js';

export function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.verify(token, secret);
}

// helper for protected routes (v2)
export function withAuth(handler) {
  return async (request, context) => {
    if (request.method === 'OPTIONS') return preflight();
    const auth = request.headers.get('authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return json({ success:false, error:'Unauthorized' }, 401);
    try {
      const claims = verifyToken(m[1]);
      context.user = claims;
      return handler(request, context);
    } catch {
      return json({ success:false, error:'Unauthorized' }, 401);
    }
  };
}
