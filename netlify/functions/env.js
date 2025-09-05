// netlify/functions/env.js
export async function handler() {
  const url = process.env.PUBLIC_SUPABASE_URL || '';
  const anon = process.env.PUBLIC_SUPABASE_ANON_KEY || '';

  const body = `
    // generated at runtime by Netlify Function
    window.ENV = Object.freeze({
      SUPABASE_URL: ${JSON.stringify(url)},
      SUPABASE_ANON_KEY: ${JSON.stringify(anon)}
    });
  `.trim();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
    body,
  };
}
