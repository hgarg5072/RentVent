// CommuteIQ engine for RentVent: TomTom live/historical routing, FHWA SHRP2 reliability percentiles,
// hourly curves (6 AM - 10 PM), Mon-Sun congestion heatmap, dual-office household scorecard, and arrival confidence.

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const PERCENTILES = [50, 75, 80, 90, 95];

export const DAY_CONGESTION_FACTORS = {
  Monday: 0.96,
  Tuesday: 1.10,
  Wednesday: 1.15,
  Thursday: 1.12,
  Friday: 0.94,
  Saturday: 0.70,
  Sunday: 0.55,
};

export const BLR_HUBS = [
  { id: 'google_ananta', name: 'Google Ananta (Bagmane ORR)', short: 'Bagmane / ORR', lat: 12.9826, lng: 77.6916 },
  { id: 'ecity_broadcom', name: 'Broadcom / Electronic City Ph 1', short: 'Electronic City', lat: 12.8378, lng: 77.6546 },
  { id: 'whitefield_itpb', name: 'Whitefield (ITPL / ITPB)', short: 'Whitefield ITPL', lat: 12.9855, lng: 77.7364 },
  { id: 'bellandur_ecoworld', name: 'Bellandur (RMZ Ecoworld)', short: 'Ecoworld ORR', lat: 12.9212, lng: 77.6815 },
  { id: 'manyata', name: 'Manyata Tech Park (Hebbal)', short: 'Manyata Hebbal', lat: 13.0458, lng: 77.6203 },
  { id: 'koramangala', name: 'Koramangala / Sony Signal', short: 'Koramangala', lat: 12.9352, lng: 77.6245 },
];

// Fast local directory of Bengaluru tech offices, parks & neighbourhoods so common searches never miss.
export const BLR_PLACES = [
  // Major tech companies & campuses
  { name: 'Broadcom (Electronic City Phase 1)', address: 'Electronic City Phase 1, Bengaluru', kind: 'office', lat: 12.8378, lng: 77.6546 },
  { name: 'Broadcom (Sarjapur / ORR)', address: 'Outer Ring Road, Bellandur, Bengaluru', kind: 'office', lat: 12.9255, lng: 77.6810 },
  { name: 'Qualcomm India (Whitefield EPIP)', address: 'EPIP Zone, Whitefield, Bengaluru', kind: 'office', lat: 12.9784, lng: 77.7266 },
  { name: 'Qualcomm India (Bagmane / ORR)', address: 'Mahadevapura, ORR, Bengaluru', kind: 'office', lat: 12.9815, lng: 77.6945 },
  { name: 'Google Ananta (Bagmane Tech Park)', address: 'Mahadevapura, ORR, Bengaluru', kind: 'office', lat: 12.9826, lng: 77.6916 },
  { name: 'Google RMZ Infinity (Old Madras Rd)', address: 'Bennigana Halli, Bengaluru', kind: 'office', lat: 12.9936, lng: 77.6606 },
  { name: 'Amazon (Bagmane Constellation ORR)', address: 'Doddanekundi, Mahadevapura, Bengaluru', kind: 'office', lat: 12.9794, lng: 77.6966 },
  { name: 'Amazon (World Trade Center / Orion)', address: 'Rajajinagar, Bengaluru', kind: 'office', lat: 13.0117, lng: 77.5549 },
  { name: 'Microsoft (Bellandur / Ferns)', address: 'Outer Ring Road, Bellandur, Bengaluru', kind: 'office', lat: 12.9261, lng: 77.6762 },
  { name: 'Microsoft (Bagmane Vigyan)', address: 'CV Raman Nagar, Bengaluru', kind: 'office', lat: 12.9841, lng: 77.6617 },
  { name: 'Goldman Sachs (Crystal Downs ORR)', address: 'Outer Ring Road, Kadubeesanahalli, Bengaluru', kind: 'office', lat: 12.9344, lng: 77.6922 },
  { name: 'Flipkart (Embassy TechVillage)', address: 'Devarabisanahalli, ORR, Bengaluru', kind: 'office', lat: 12.9288, lng: 77.6897 },
  { name: 'Cisco Systems (Cessna Business Park)', address: 'Kadubeesanahalli, ORR, Bengaluru', kind: 'office', lat: 12.9367, lng: 77.6952 },
  { name: 'Intel (Ecospace / Devarabisanahalli)', address: 'Outer Ring Road, Bellandur, Bengaluru', kind: 'office', lat: 12.9267, lng: 77.6826 },
  { name: 'SAP Labs India (Whitefield)', address: 'EPIP Zone, Whitefield, Bengaluru', kind: 'office', lat: 12.9781, lng: 77.7155 },
  { name: 'Infosys Campus (Electronic City)', address: 'Hosur Road, Electronic City, Bengaluru', kind: 'office', lat: 12.8498, lng: 77.6631 },
  { name: 'Wipro Corporate Office (Sarjapur Rd)', address: 'Doddakannelli, Sarjapur Road, Bengaluru', kind: 'office', lat: 12.9102, lng: 77.6852 },
  { name: 'RMZ Ecoworld (Bellandur)', address: 'Outer Ring Road, Bellandur, Bengaluru', kind: 'office', lat: 12.9212, lng: 77.6815 },
  { name: 'Prestige Tech Park (Kadubeesanahalli)', address: 'Outer Ring Road, Marathahalli, Bengaluru', kind: 'office', lat: 12.9428, lng: 77.6968 },
  { name: 'Manyata Tech Park (Hebbal)', address: 'Nagawara, Outer Ring Road, Bengaluru', kind: 'office', lat: 13.0458, lng: 77.6203 },
  { name: 'ITPL / ITPB (Whitefield)', address: 'Whitefield Main Road, Bengaluru', kind: 'office', lat: 12.9855, lng: 77.7364 },
  // Popular Bengaluru neighbourhoods / areas
  { name: 'Bellandur', address: 'Outer Ring Road, Bengaluru', kind: 'area', lat: 12.9259, lng: 77.6762 },
  { name: 'HSR Layout', address: 'South-East Bengaluru', kind: 'area', lat: 12.9121, lng: 77.6446 },
  { name: 'Indiranagar', address: 'Central-East Bengaluru', kind: 'area', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala', address: 'South-East Bengaluru', kind: 'area', lat: 12.9352, lng: 77.6245 },
  { name: 'Whitefield', address: 'East Bengaluru', kind: 'area', lat: 12.9698, lng: 77.7500 },
  { name: 'Marathahalli', address: 'Outer Ring Road, East Bengaluru', kind: 'area', lat: 12.9591, lng: 77.6974 },
  { name: 'Sarjapur Road', address: 'South-East Bengaluru', kind: 'area', lat: 12.9081, lng: 77.6858 },
  { name: 'Electronic City', address: 'Hosur Road, South Bengaluru', kind: 'area', lat: 12.8452, lng: 77.6602 },
  { name: 'Kadubeesanahalli', address: 'Outer Ring Road, Bengaluru', kind: 'area', lat: 12.9378, lng: 77.6952 },
  { name: 'Haralur Road', address: 'Off Sarjapur Road, Bengaluru', kind: 'area', lat: 12.9012, lng: 77.6578 },
  { name: 'Mahadevapura', address: 'Outer Ring Road, Bengaluru', kind: 'area', lat: 12.9896, lng: 77.6915 },
  { name: 'Brookefield', address: 'ITPL / Kundalahalli, Bengaluru', kind: 'area', lat: 12.9655, lng: 77.7176 },
  { name: 'BTM Layout', address: 'South Bengaluru', kind: 'area', lat: 12.9166, lng: 77.6101 },
  { name: 'JP Nagar', address: 'South Bengaluru', kind: 'area', lat: 12.9063, lng: 77.5857 },
  { name: 'Jayanagar', address: 'South Bengaluru', kind: 'area', lat: 12.9308, lng: 77.5838 },
  { name: 'Hebbal', address: 'North Bengaluru', kind: 'area', lat: 13.0358, lng: 77.5970 },
  { name: 'Yelahanka', address: 'North Bengaluru', kind: 'area', lat: 13.1007, lng: 77.5963 },
  { name: 'Bannerghatta Road', address: 'South Bengaluru', kind: 'area', lat: 12.8891, lng: 77.5968 },
  { name: 'Kanakapura Road', address: 'South Bengaluru', kind: 'area', lat: 12.8855, lng: 77.5528 },
  { name: 'KR Puram / Hoodi', address: 'East Bengaluru', kind: 'area', lat: 12.9990, lng: 77.7050 },
];

export function matchLocalPlaces(query, kind = null) {
  const words = String(query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return BLR_PLACES.filter((p) => {
    if (kind && p.kind !== kind) return false;
    const hay = `${p.name} ${p.address}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

// Bengaluru locality slugs for on-demand background rental fetching within a pinned radius.
export const BLR_LOCALITY_SLUGS = [
  { slug: 'bellandur', name: 'Bellandur', lat: 12.9259, lng: 77.6762 },
  { slug: 'hsr-layout', name: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
  { slug: 'koramangala', name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { slug: 'indira-nagar', name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { slug: 'whitefield', name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { slug: 'marathahalli', name: 'Marathahalli', lat: 12.9591, lng: 77.6974 },
  { slug: 'sarjapur-road', name: 'Sarjapur Road', lat: 12.9081, lng: 77.6858 },
  { slug: 'electronic-city', name: 'Electronic City', lat: 12.8452, lng: 77.6602 },
  { slug: 'kadubeesanahalli', name: 'Kadubeesanahalli', lat: 12.9378, lng: 77.6952 },
  { slug: 'haralur-road', name: 'Haralur Road', lat: 12.9012, lng: 77.6578 },
  { slug: 'mahadevapura', name: 'Mahadevapura', lat: 12.9896, lng: 77.6915 },
  { slug: 'brookefield', name: 'Brookefield', lat: 12.9655, lng: 77.7176 },
  { slug: 'btm-layout', name: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { slug: 'jp-nagar', name: 'JP Nagar', lat: 12.9063, lng: 77.5857 },
  { slug: 'jayanagar', name: 'Jayanagar', lat: 12.9308, lng: 77.5838 },
  { slug: 'hebbal', name: 'Hebbal', lat: 13.0358, lng: 77.5970 },
  { slug: 'yelahanka', name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
  { slug: 'bannerghatta-road', name: 'Bannerghatta Road', lat: 12.8891, lng: 77.5968 },
  { slug: 'kanakapura-road', name: 'Kanakapura Road', lat: 12.8855, lng: 77.5528 },
  { slug: 'kr-puram', name: 'KR Puram', lat: 13.0012, lng: 77.6954 },
  { slug: 'hoodi', name: 'Hoodi', lat: 12.9922, lng: 77.7159 },
  { slug: 'kudlu', name: 'Kudlu', lat: 12.8862, lng: 77.6558 },
  { slug: 'varthur', name: 'Varthur', lat: 12.9389, lng: 77.7412 },
  { slug: 'panathur', name: 'Panathur', lat: 12.9344, lng: 77.7048 },
  { slug: 'kasavanahalli', name: 'Kasavanahalli', lat: 12.9069, lng: 77.6754 },
  { slug: 'domlur', name: 'Domlur', lat: 12.9609, lng: 77.6387 },
  { slug: 'cv-raman-nagar', name: 'CV Raman Nagar', lat: 12.9855, lng: 77.6639 },
  { slug: 'hennur', name: 'Hennur', lat: 13.0398, lng: 77.6431 },
  { slug: 'thanisandra', name: 'Thanisandra', lat: 13.0588, lng: 77.6335 },
  { slug: 'banashankari', name: 'Banashankari', lat: 12.9255, lng: 77.5468 },
];

export function localitiesInRadius(lat, lng, km, maxCount = 8) {
  const pt = { lat, lng };
  return BLR_LOCALITY_SLUGS
    .map((l) => ({ ...l, d: haversineKm(pt, l) }))
    .filter((l) => l.d <= km + 2.5)
    .sort((a, b) => a.d - b.d)
    .slice(0, maxCount);
}

const KEY_STORAGE = 'rentvent_tomtom_key';
const memCache = new Map();

export function getCustomTomTomKey() {
  try { return localStorage.getItem(KEY_STORAGE)?.trim() || ''; } catch { return ''; }
}
export function setCustomTomTomKey(key) {
  try {
    if (key?.trim()) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch { /* ignore */ }
}

export function haversineKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return Infinity;
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function officeScoreKm(society, office1, office2, bias = 50) {
  if (!office1) return Infinity;
  const d1 = haversineKm(society, office1);
  if (!office2) return d1;
  const d2 = haversineKm(society, office2);
  const w2 = Math.max(0, Math.min(100, bias)) / 100;
  const w1 = 1 - w2;
  return d1 * w1 + d2 * w2;
}

/**
 * FHWA SHRP2 travel-time reliability percentiles (P10, P50, P75, P80, P90, P95).
 */
export function calculatePercentiles(freeFlowSeconds, expectedSeconds) {
  const freeFlowMin = Math.max(1, Math.round(freeFlowSeconds / 60));
  const expectedMin = Math.max(freeFlowMin, Math.round(expectedSeconds / 60));
  const delayMin = Math.max(0, expectedMin - freeFlowMin);
  const congestionMultiplier = Number((expectedMin / freeFlowMin).toFixed(2));

  const sigma = delayMin === 0
    ? Math.max(2, Math.round(freeFlowMin * 0.08))
    : Math.max(3, Math.round(delayMin * 0.45 + (congestionMultiplier - 1.0) * freeFlowMin * 0.18));

  return {
    freeFlowMinutes: Math.max(freeFlowMin, Math.round(expectedMin - 1.28 * sigma)),
    medianMinutes: expectedMin,
    p75Minutes: Math.round(expectedMin + 0.674 * sigma),
    p80Minutes: Math.round(expectedMin + 0.8416 * sigma),
    p90Minutes: Math.round(expectedMin + 1.282 * sigma),
    p95Minutes: Math.round(expectedMin + 1.645 * sigma),
    congestionMultiplier,
  };
}

export function pickPercentile(sample, pct = 80) {
  if (!sample) return 0;
  if (pct === 50) return sample.medianMinutes;
  if (pct === 75) return sample.p75Minutes;
  if (pct === 80) return sample.p80Minutes;
  if (pct === 90) return sample.p90Minutes;
  return sample.p95Minutes;
}

export function generateHourlyCommuteCurve(direction, baseFreeFlowMin, basePeakDelayMin, day = 'Wednesday') {
  const dayFactor = DAY_CONGESTION_FACTORS[day] ?? 1.0;
  const samples = [];

  for (let hour = 6; hour <= 22; hour++) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const timeLabel = `${displayHour}:00 ${ampm}`;
    let f = 0.08;

    if (direction === 'inbound') {
      if (hour === 7) f = 0.55;
      else if (hour === 8) f = 0.95;
      else if (hour === 9) f = 1.0;
      else if (hour === 10) f = 0.50;
      else if (hour >= 11 && hour <= 14) f = 0.25;
      else if (hour >= 16 && hour <= 19) f = 0.55;
    } else {
      if (hour >= 7 && hour <= 9) f = 0.40;
      else if (hour >= 11 && hour <= 14) f = 0.25;
      else if (hour === 15) f = 0.50;
      else if (hour === 16) f = 0.85;
      else if (hour === 17) f = 1.0;
      else if (hour === 18) f = 0.92;
      else if (hour === 19) f = 0.65;
      else if (hour === 20) f = 0.35;
      else if (hour === 21) f = 0.15;
    }

    if (day === 'Friday' && direction === 'outbound') {
      if (hour === 15) f = 0.80;
      else if (hour === 16) f = 1.0;
      else if (hour === 17) f = 0.85;
      else if (hour === 18) f = 0.50;
    }

    const expectedMin = baseFreeFlowMin + Math.round(basePeakDelayMin * f * dayFactor);
    const p = calculatePercentiles(baseFreeFlowMin * 60, expectedMin * 60);
    samples.push({ hour, timeLabel, ...p });
  }
  return samples;
}

export function generateWeeklyHeatmap(amFreeFlowMin, amPeakDelayMin, pmFreeFlowMin, pmPeakDelayMin, amHour = 8, pmHour = 18) {
  return DAYS.map((day) => {
    const amCurve = generateHourlyCommuteCurve('inbound', amFreeFlowMin, amPeakDelayMin, day);
    const pmCurve = generateHourlyCommuteCurve('outbound', pmFreeFlowMin, pmPeakDelayMin, day);
    const am = amCurve.find((x) => x.hour === amHour) || amCurve[2];
    const pm = pmCurve.find((x) => x.hour === pmHour) || pmCurve[12];
    return {
      day,
      short: day.slice(0, 3),
      am,
      pm,
      totalP50: am.medianMinutes + pm.medianMinutes,
      totalP80: am.p80Minutes + pm.p80Minutes,
      totalP95: am.p95Minutes + pm.p95Minutes,
    };
  });
}

export function parseTimeToMinutes(hhmm) {
  const [h, m] = String(hhmm || '09:00').split(':').map(Number);
  return (Number.isFinite(h) ? h : 9) * 60 + (Number.isFinite(m) ? m : 0);
}

export function formatClock(totalMinutes) {
  const mins = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function calculateArrivalWindows(targetArrivalHHMM, sample) {
  const target = parseTimeToMinutes(targetArrivalHHMM);
  return {
    targetLabel: formatClock(target),
    p50Leave: formatClock(target - sample.medianMinutes),
    p80Leave: formatClock(target - sample.p80Minutes),
    p95Leave: formatClock(target - sample.p95Minutes),
    bufferMin: sample.p95Minutes - sample.medianMinutes,
  };
}

/**
 * Next upcoming Wednesday at given local IST time (HH:MM) as ISO string for TomTom historical traffic.
 */
export function nextWeekdayDepartISO(hhmm = '08:30') {
  const [h, m] = String(hhmm).split(':').map(Number);
  const now = new Date();
  const d = new Date(now.getTime());
  // Move to next Wednesday (day 3) in the future so TomTom returns full historic weekday traffic
  const diff = (3 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  // Format as IST (+05:30)
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h || 8)}:${pad(m || 30)}:00+05:30`;
}

async function tomtomFetch(pathAndQuery) {
  const customKey = getCustomTomTomKey();
  const headers = { Accept: 'application/json' };
  if (customKey) headers['X-TomTom-Key'] = customKey;
  const res = await fetch(`/api/tomtom/${pathAndQuery}`, { headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    let msg = `TomTom proxy HTTP ${res.status}`;
    try { msg = JSON.parse(txt).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

export async function geocodeOffice(query, center = { lat: 12.9716, lng: 77.5946 }) {
  const raw = String(query || '').trim();
  if (!raw) return [];

  // 1. Instant local Bengaluru tech-office & neighbourhood matches
  const merged = [];
  const addUnique = (item) => {
    if (!item || item.lat == null || item.lng == null) return;
    if (merged.some((m) => haversineKm(m, item) < 0.25 && m.name.toLowerCase() === item.name.toLowerCase())) return;
    merged.push(item);
  };
  for (const p of matchLocalPlaces(raw).slice(0, 4)) addUnique(p);

  // 2. TomTom Search with typeahead=true
  const q = encodeURIComponent(raw);
  const qs = new URLSearchParams({
    limit: '6',
    countrySet: 'IN',
    lat: String(center.lat),
    lon: String(center.lng),
    radius: '50000',
    typeahead: 'true',
  });
  try {
    const data = await tomtomFetch(`search/2/search/${q}.json?${qs.toString()}`);
    for (const r of data.results || []) {
      addUnique({
        name: r.poi?.name || r.address?.freeformAddress || raw,
        address: r.address?.freeformAddress || '',
        lat: r.position.lat,
        lng: r.position.lon,
      });
    }
  } catch { /* fall through to Photon */ }

  // 3. OpenStreetMap Photon fallback if fewer than 3 hits
  if (merged.length < 3) {
    try {
      const pUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(raw + ' Bengaluru')}&lat=${center.lat}&lon=${center.lng}&limit=5`;
      const res = await fetch(pUrl, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const pd = await res.json();
        for (const f of pd.features || []) {
          const [lng, lat] = f.geometry?.coordinates || [];
          const pr = f.properties || {};
          if (lat != null && lng != null && haversineKm(center, { lat, lng }) < 60) {
            addUnique({
              name: pr.name || pr.street || raw,
              address: [pr.district || pr.locality, pr.city, pr.state].filter(Boolean).join(', '),
              lat,
              lng,
            });
          }
        }
      }
    } catch { /* ignore */ }
  }

  return merged.slice(0, 6);
}

export async function fetchTomTomRoute(origin, dest, departAtISO) {
  const loc = `${origin.lat},${origin.lng}:${dest.lat},${dest.lng}`;
  const qs = new URLSearchParams({
    departAt: departAtISO,
    traffic: 'true',
    computeTravelTimeFor: 'all',
    maxAlternatives: '2',
  });
  const data = await tomtomFetch(`routing/1/calculateRoute/${loc}/json?${qs.toString()}`);
  if (!data.routes?.length) throw new Error('No route found');

  const routes = data.routes.map((r, idx) => {
    const s = r.summary || {};
    const distKm = Number(((s.lengthInMeters || 0) / 1000).toFixed(1));
    const expectedSec = s.historicTrafficTravelTimeInSeconds || s.travelTimeInSeconds || 900;
    const freeFlowSec = s.noTrafficTravelTimeInSeconds || Math.round(expectedSec * 0.58);
    const pcts = calculatePercentiles(freeFlowSec, expectedSec);
    const pts = (r.legs?.[0]?.points || []).map((p) => [p.longitude, p.latitude]); // GeoJSON [lng, lat]
    return {
      idx,
      label: idx === 0 ? 'Primary fastest route' : `Alternative route ${idx + 1}`,
      distKm,
      freeFlowSec,
      expectedSec,
      ...pcts,
      coordinates: pts,
    };
  });
  return routes;
}

export function buildOfficeLegAnalysis(office, amRoutes, pmRoutes, amTime = '08:30', pmTime = '17:30') {
  const am = amRoutes[0];
  const pm = pmRoutes[0];
  const amHour = Math.max(6, Math.min(22, parseInt(amTime.split(':')[0], 10) || 8));
  const pmHour = Math.max(6, Math.min(22, parseInt(pmTime.split(':')[0], 10) || 18));

  const amDelay = Math.max(2, am.medianMinutes - am.freeFlowMinutes);
  const pmDelay = Math.max(2, pm.medianMinutes - pm.freeFlowMinutes);
  const amCurve = generateHourlyCommuteCurve('inbound', am.freeFlowMinutes, amDelay, 'Wednesday');
  const pmCurve = generateHourlyCommuteCurve('outbound', pm.freeFlowMinutes, pmDelay, 'Wednesday');
  const weekly = generateWeeklyHeatmap(am.freeFlowMinutes, amDelay, pm.freeFlowMinutes, pmDelay, amHour, pmHour);

  // Predictability score (0-100): tighter P95/P50 ratio => higher predictability
  const spreadRatio = ((am.p95Minutes / Math.max(1, am.medianMinutes)) + (pm.p95Minutes / Math.max(1, pm.medianMinutes))) / 2;
  const predictabilityScore = Math.max(20, Math.min(98, Math.round(115 - (spreadRatio - 1) * 110)));
  const predictabilityLabel = predictabilityScore >= 75 ? 'High reliability' : predictabilityScore >= 55 ? 'Moderate variance' : 'High junction volatility';

  // Estimated monthly fuel cost (22 workdays, ₹102/L petrol, ~11 km/L city mileage)
  const dailyKm = am.distKm + pm.distKm;
  const monthlyFuelINR = Math.round((dailyKm * 22 / 11) * 102);

  return {
    office,
    am,
    pm,
    amAlternatives: amRoutes,
    pmAlternatives: pmRoutes,
    amCurve,
    pmCurve,
    weekly,
    dailyKm: Number(dailyKm.toFixed(1)),
    monthlyFuelINR,
    predictabilityScore,
    predictabilityLabel,
  };
}

export function summarizeHousehold(legs, percentile = 80, workDaysPerWeek = 5) {
  const perLeg = legs.map((leg) => {
    const amMin = pickPercentile(leg.am, percentile);
    const pmMin = pickPercentile(leg.pm, percentile);
    const dailyMin = amMin + pmMin;
    return {
      officeName: leg.office.name,
      amMin,
      pmMin,
      dailyMin,
      weeklyHours: Number(((dailyMin * workDaysPerWeek) / 60).toFixed(1)),
      annualHours: Math.round((dailyMin * workDaysPerWeek * 48) / 60),
      monthlyFuelINR: leg.monthlyFuelINR,
      dailyKm: leg.dailyKm,
      predictabilityScore: leg.predictabilityScore,
      predictabilityLabel: leg.predictabilityLabel,
    };
  });

  const totalDailyMin = perLeg.reduce((a, b) => a + b.dailyMin, 0);
  const totalWeeklyHours = Number(perLeg.reduce((a, b) => a + b.weeklyHours, 0).toFixed(1));
  const totalAnnualHours = perLeg.reduce((a, b) => a + b.annualHours, 0);
  const totalFuelINR = perLeg.reduce((a, b) => a + b.monthlyFuelINR, 0);
  const parityDeltaMin = perLeg.length === 2 ? Math.abs(perLeg[0].dailyMin - perLeg[1].dailyMin) : 0;
  const avgDailyPerPerson = totalDailyMin / Math.max(1, perLeg.length);
  const verdict = avgDailyPerPerson <= 50 ? 'Optimal Commute'
    : avgDailyPerPerson <= 80 ? 'Good Commute'
      : avgDailyPerPerson <= 115 ? 'Moderate Commute' : 'High Commute Burden';

  return {
    percentile,
    perLeg,
    totalDailyMin,
    totalWeeklyHours,
    totalAnnualHours,
    totalFuelINR,
    parityDeltaMin,
    verdict,
  };
}

export async function analyzeSocietyCommute(society, { office1, office2, amTime = '08:30', pmTime = '17:30' }) {
  const offices = [office1, office2].filter(Boolean);
  if (!offices.length) return null;

  const cacheKey = `rv_c_${society.id}_${offices.map((o) => `${o.lat.toFixed(4)},${o.lng.toFixed(4)}`).join('|')}_${amTime}_${pmTime}`;
  if (memCache.has(cacheKey)) return memCache.get(cacheKey);
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      memCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch { /* ignore */ }

  const amISO = nextWeekdayDepartISO(amTime);
  const pmISO = nextWeekdayDepartISO(pmTime);

  const legs = await Promise.all(offices.map(async (office) => {
    const [amRoutes, pmRoutes] = await Promise.all([
      fetchTomTomRoute(society, office, amISO),
      fetchTomTomRoute(office, society, pmISO),
    ]);
    return buildOfficeLegAnalysis(office, amRoutes, pmRoutes, amTime, pmTime);
  }));

  const result = { societyId: society.id, legs, fetchedAt: Date.now() };
  memCache.set(cacheKey, result);
  try { sessionStorage.setItem(cacheKey, JSON.stringify(result)); } catch { /* ignore */ }
  return result;
}

export function buildRoutesGeoJSON(analysis) {
  if (!analysis?.legs?.length) return { type: 'FeatureCollection', features: [] };
  const features = [];
  analysis.legs.forEach((leg, officeIdx) => {
    const role = officeIdx === 0 ? 'office1' : 'office2';
    (leg.amAlternatives || []).forEach((route, rIdx) => {
      if (route.coordinates?.length > 1) {
        features.push({
          type: 'Feature',
          properties: { role, primary: rIdx === 0 ? 1 : 0, label: route.label },
          geometry: { type: 'LineString', coordinates: route.coordinates },
        });
      }
    });
  });
  return { type: 'FeatureCollection', features };
}
