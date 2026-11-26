// Cloudflare Pages Function: on-demand background fetcher for live Bengaluru rental listings by locality slug.
// Parses Magicbricks SSR preloaded state cleanly and groups listings into RentVent society objects.

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const SLUG_RE = /^[a-z0-9-]+$/;

function median(arr) {
  const s = arr.slice().sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
}

function parseCoords(item) {
  if (item.pmtLat && item.pmtLong && item.pmtLat > 10 && item.pmtLong > 70) {
    return [Number(item.pmtLat), Number(item.pmtLong)];
  }
  if (typeof item.ltcoordGeo === 'string' && item.ltcoordGeo.includes(',')) {
    const [a, b] = item.ltcoordGeo.split(',').map(Number);
    if (a > 10 && b > 70) return [a, b];
  }
  return [null, null];
}

function normId(slug, name) {
  return `live-${slug}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42)}`;
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' } });
  }
  const u = new URL(request.url);
  const slug = (u.searchParams.get('slug') || '').toLowerCase().trim();
  const city = (u.searchParams.get('city') || 'bangalore').toLowerCase().trim();
  const refresh = u.searchParams.get('refresh') === '1';
  if (!slug || !SLUG_RE.test(slug) || !SLUG_RE.test(city)) {
    return new Response(JSON.stringify({ error: 'Invalid slug or city' }), { status: 400, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
  }

  const serveSnapshot = async () => {
    try {
      const assetRes = await env.ASSETS.fetch(new Request(`${u.origin}/data/areas/${city}/${slug}.json`));
      if (assetRes.ok) {
        const data = await assetRes.json();
        return new Response(JSON.stringify({ ...data, source: 'snapshot' }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'cache-control': refresh ? 'no-store' : 'public, max-age=1800',
          },
        });
      }
    } catch { /* ignore */ }
    return null;
  };

  // Normal load: serve pre-fetched area shard instantly (zero WAF blocks)
  if (!refresh) {
    const snap = await serveSnapshot();
    if (snap) return snap;
  }

  // On explicit refresh=1 (or missing shard): try live fetch first, fall back to snapshot if portal blocks edge IP
  const target = `https://www.magicbricks.com/flats-for-rent-in-${slug}-${city}-pppfr`;
  try {
    const res = await fetch(target, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
    if (!res.ok) {
      const snap = await serveSnapshot();
      if (snap) return snap;
      return new Response(JSON.stringify({ slug, societies: [], raw_count: 0, status: res.status, source: 'blocked' }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      });
    }
    const html = await res.text();
    const marker = html.indexOf('window.SERVER_PRELOADED_STATE_');
    const jsonStart = marker >= 0 ? html.indexOf('{', marker) : -1;
    const scriptEnd = jsonStart >= 0 ? html.indexOf('</script>', jsonStart) : -1;
    if (jsonStart < 0 || scriptEnd < 0) {
      const snap = await serveSnapshot();
      if (snap) return snap;
      return new Response(JSON.stringify({ slug, societies: [], raw_count: 0, html_len: html.length }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      });
    }
    const rawJson = html.slice(jsonStart, scriptEnd).trim().replace(/;+$/, '');
    const state = JSON.parse(rawJson);
    const list = Array.isArray(state.searchResult) ? state.searchResult : [];

    // Group individual rental listings by society name
    const grouped = new Map();
    for (const item of list) {
      const [lat, lng] = parseCoords(item);
      const rent = Number(item.price) || 0;
      const bhk = parseInt(item.bedroomD, 10) || null;
      if (!lat || !lng || rent < 4000 || rent > 2000000) continue;

      const rawName = (item.prjname || '').trim();
      const loc = (item.lmtDName || slug.replace(/-/g, ' ')).trim();
      const name = rawName || `${bhk ? bhk + ' BHK ' : ''}Flat in ${loc}`;
      const key = (rawName || `${loc}-${lat.toFixed(3)},${lng.toFixed(3)}`).toLowerCase();

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: normId(slug, rawName || `${loc}-${item.id || Math.round(lat * 1000)}`),
          name,
          developer: item.devName || '',
          locality: loc,
          lat,
          lng,
          kind: 'apartment',
          status: 'Ready To Move',
          url: item.url ? `https://www.magicbricks.com/propertyDetails/${item.url}` : target,
          gmaps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + loc + ' Bengaluru')}`,
          amenities: [],
          amen_facts: {},
          verified: false,
          live_fetched: true,
          byBhk: {},
          totalRent: 0,
        });
      }
      const g = grouped.get(key);
      g.totalRent += 1;
      const bKey = String(bhk || 2);
      const bucket = (g.byBhk[bKey] ||= { rents: [], sqfts: [] });
      bucket.rents.push(rent);
      const sqft = Number(item.caSqFt || item.coveredArea || item.carpetArea) || 0;
      if (sqft > 200 && sqft < 20000) bucket.sqfts.push(sqft);
    }

    const societies = [...grouped.values()].map((g) => {
      const prices = {};
      const unit_types = [];
      for (const [b, bk] of Object.entries(g.byBhk)) {
        const med = median(bk.rents);
        prices[b] = {
          rent: { median: Math.round(med), min: Math.min(...bk.rents), max: Math.max(...bk.rents), n: bk.rents.length },
        };
        const sz = bk.sqfts.length ? Math.round(median(bk.sqfts)) : null;
        unit_types.push({ label: `${b} BHK${sz ? ' ' + sz.toLocaleString() : ''}`, bhk: Number(b), size_sqft: sz, bedrooms: [], rooms_complete: false });
      }
      const { byBhk, totalRent, ...rest } = g;
      return { ...rest, rent_count: totalRent, sale_count: 0, prices, unit_types, nearby: {}, score: null, shape: 'live' };
    });

    return new Response(JSON.stringify({ slug, societies, raw_count: list.length, source: 'live', fetched: new Date().toISOString().slice(0, 10) }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=900',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ slug, societies: [], error: e.message }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }
}
