// v2 helpers: Response + CORS
const ORIGIN = 'https://froggyhubapp.netlify.app';

export const corsHeaders = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extraHeaders }
  });
}

export function preflight() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
