// Cloudflare Pages Function: proxies TomTom Routing & Search APIs so the API key stays server-side.
// Supports optional user override via X-TomTom-Key header (never committed to git).

const ALLOWED_PREFIXES = ['routing/1/calculateRoute/', 'search/2/search/', 'search/2/geocode/'];

export async function onRequest({ request, env, params }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'Content-Type, X-TomTom-Key',
      },
    });
  }
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
  }

  const rawPath = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!ALLOWED_PREFIXES.some((p) => rawPath.startsWith(p))) {
    return new Response(JSON.stringify({ error: 'Endpoint not allowed' }), { status: 403, headers: { 'content-type': 'application/json' } });
  }

  const key = request.headers.get('X-TomTom-Key')?.trim() || env.TOMTOM_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'TomTom API key not configured. Add TOMTOM_API_KEY secret or set a custom key in RentVent.' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }

  const inUrl = new URL(request.url);
  const outParams = new URLSearchParams(inUrl.search);
  outParams.set('key', key);

  const upstream = `https://api.tomtom.com/${rawPath}?${outParams.toString()}`;
  const res = await fetch(upstream, { headers: { Accept: 'application/json' } });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': res.ok ? 'public, max-age=1800' : 'no-store',
    },
  });
}
