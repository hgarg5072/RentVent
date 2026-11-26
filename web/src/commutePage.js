// Full-screen CommuteIQ Traffic Analysis page (opened in a new tab via ?view=commute&...)
import { analyzeSocietyCommute, calculateArrivalWindows, pickPercentile, summarizeHousehold } from './commute.js';
import { formatINR } from './filters.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function fullBarSvg(curve, activeHour, pct = 80, color = '#38bdf8') {
  const w = 520, h = 190, padL = 34, padR = 10, padT = 24, padB = 26;
  const maxVal = Math.max(...curve.map((c) => c.p95Minutes), 30);
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const step = plotW / curve.length;
  const barW = Math.max(14, step - 6);
  const yOf = (v) => padT + (1 - v / maxVal) * plotH;

  const grids = [0, Math.round(maxVal / 2), maxVal].map((v) => {
    const y = yOf(v).toFixed(1);
    return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="currentColor" opacity=".1"/>
      <text x="${padL - 6}" y="${(+y + 3).toFixed(1)}" text-anchor="end" fill="currentColor" opacity=".6" font-size="10">${v}m</text>`;
  }).join('');

  const bars = curve.map((c, i) => {
    const x = padL + i * step + (step - barW) / 2;
    const isAct = c.hour === activeHour;
    const val = pickPercentile(c, pct);
    const yFree = yOf(c.freeFlowMinutes);
    const yVal = yOf(val);
    const yP95 = yOf(c.p95Minutes);
    const baseY = yOf(0);
    const fill = isAct ? '#ffd9a0' : color;
    const lbl = c.hour === 12 ? '12p' : c.hour > 12 ? `${c.hour - 12}p` : `${c.hour}a`;
    return `<g>
      <line x1="${(x + barW / 2).toFixed(1)}" y1="${yP95.toFixed(1)}" x2="${(x + barW / 2).toFixed(1)}" y2="${yVal.toFixed(1)}" stroke="${fill}" stroke-width="1.6" opacity=".6"/>
      <rect x="${x.toFixed(1)}" y="${yVal.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2, baseY - yVal).toFixed(1)}" rx="3" fill="${fill}" opacity="${isAct ? '0.95' : '0.45'}"/>
      <rect x="${x.toFixed(1)}" y="${yFree.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, baseY - yFree).toFixed(1)}" rx="2" fill="${fill}" opacity="${isAct ? '1' : '0.85'}"/>
      <text x="${(x + barW / 2).toFixed(1)}" y="${Math.max(12, yP95 - 5).toFixed(1)}" text-anchor="middle" fill="${isAct ? '#ffd9a0' : 'currentColor'}" opacity="${isAct ? '1' : '.65'}" font-size="${isAct ? '11' : '9.5'}" font-weight="${isAct ? '700' : '400'}">${val}m</text>
      <text x="${(x + barW / 2).toFixed(1)}" y="${h - 6}" text-anchor="middle" fill="currentColor" opacity="${isAct ? '1' : '.6'}" font-size="10" font-weight="${isAct ? '600' : '400'}">${lbl}</text>
    </g>`;
  }).join('');
  return `<svg class="ciq-svg" viewBox="0 0 ${w} ${h}" width="100%" height="${h}">${grids}${bars}</svg>`;
}

function heatBg(val, min, max) {
  const t = max > min ? (val - min) / (max - min) : 0.5;
  if (t < 0.35) return 'rgba(56, 189, 248, 0.22)';
  if (t < 0.7) return 'rgba(255, 217, 160, 0.28)';
  return 'rgba(255, 120, 100, 0.36)';
}

function parseOfficeParam(val) {
  if (!val) return null;
  const [lat, lng, ...rest] = val.split(',');
  const la = Number(lat), ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  return { lat: la, lng: ln, name: decodeURIComponent(rest.join(',') || 'Office') };
}

export async function renderFullCommutePage(params) {
  document.body.className = 'commute-fullpage';
  const cityId = params.get('city') || 'bangalore';
  const sid = params.get('open');
  const office1 = parseOfficeParam(params.get('o1'));
  const office2 = parseOfficeParam(params.get('o2'));
  const amTime = params.get('am') || '08:30';
  const pmTime = params.get('pm') || '17:30';
  let pct = Number(params.get('pct')) || 80;
  let targetArrival = '09:30';

  const root = document.createElement('div');
  root.className = 'fp-wrap';
  root.innerHTML = `<div class="fp-loading">Loading full-screen CommuteIQ analysis…</div>`;
  document.body.replaceChildren(root);

  // Load society from static city data (or URL fallback for live-fetched area societies)
  let society = null;
  try {
    const city = await fetch(`/data/${cityId}.json`).then((r) => r.json());
    society = city.societies.find((s) => s.id === sid);
  } catch { /* ignore */ }
  if (!society && params.get('slat') && params.get('slng')) {
    society = {
      id: sid || 'custom',
      name: params.get('sname') || 'Selected Society',
      locality: params.get('sloc') || '',
      lat: Number(params.get('slat')),
      lng: Number(params.get('slng')),
      prices: {},
    };
  }
  if (!society || (!office1 && !office2)) {
    root.innerHTML = `<div class="fp-err"><h2>Missing society or office location</h2><p>Open a society on the map with an office set, then click Full-Screen Analysis.</p><a class="primary" href="/?city=${esc(cityId)}">← Back to RentVent Map</a></div>`;
    return;
  }

  document.title = `CommuteIQ · ${society.name} · RentVent`;
  const analysis = await analyzeSocietyCommute(society, { office1, office2, amTime, pmTime });

  const paint = () => {
    const summary = summarizeHousehold(analysis.legs, pct);
    const hrs = Math.floor(summary.totalDailyMin / 60);
    const rem = summary.totalDailyMin % 60;
    const totalHuman = hrs ? `${hrs}h ${rem}m` : `${rem} min`;
    const amHour = parseInt(amTime.split(':')[0], 10) || 8;
    const pmHour = parseInt(pmTime.split(':')[0], 10) || 18;

    const legSections = analysis.legs.map((leg, idx) => {
      const color = idx === 0 ? '#38bdf8' : '#c084fc';
      const wkVals = leg.weekly.map((d) => d.totalP80);
      const wkMin = Math.min(...wkVals), wkMax = Math.max(...wkVals);
      const arr = calculateArrivalWindows(targetArrival, leg.am);
      const gmapsDir = `https://www.google.com/maps/dir/?api=1&origin=${society.lat},${society.lng}&destination=${leg.office.lat},${leg.office.lng}&travelmode=driving`;

      return `<section class="fp-card">
        <div class="fp-card-head">
          <div>
            <div class="k">Office ${idx + 1} · ${leg.am.distKm} km each way · ${leg.predictabilityLabel} (${leg.predictabilityScore}/100)</div>
            <h2>${esc(leg.office.name)}</h2>
            <div class="fine">${leg.am.calibrated ? `Bengaluru rush-hour calibrated · Raw TomTom baseline: ${leg.am.rawTomTomMinutes}m AM / ${leg.pm.rawTomTomMinutes}m PM` : 'TomTom historic traffic'}</div>
          </div>
          <a class="btnlink" href="${esc(gmapsDir)}" target="_blank" rel="noopener">Verify live in Google Maps ↗</a>
        </div>

        <div class="fp-leg-kpis">
          <div><span>Morning (${amTime})</span><b>${pickPercentile(leg.am, pct)} min</b><small>Free ${leg.am.freeFlowMinutes}m · P50 ${leg.am.medianMinutes}m · P95 ${leg.am.p95Minutes}m</small></div>
          <div><span>Evening (${pmTime})</span><b>${pickPercentile(leg.pm, pct)} min</b><small>Free ${leg.pm.freeFlowMinutes}m · P50 ${leg.pm.medianMinutes}m · P95 ${leg.pm.p95Minutes}m</small></div>
          <div><span>Round Trip (P${pct})</span><b>${pickPercentile(leg.am, pct) + pickPercentile(leg.pm, pct)} min/day</b><small>${leg.dailyKm} km/day · ~₹${leg.monthlyFuelINR.toLocaleString()}/mo fuel</small></div>
        </div>

        <div class="fp-charts">
          <div>
            <div class="k row">Morning: Home → Office (6 AM – 10 PM) <span class="fine">Bar = P${pct} · Whisker = P95</span></div>
            ${fullBarSvg(leg.amCurve, amHour, pct, color)}
          </div>
          <div>
            <div class="k row">Evening: Office → Home (6 AM – 10 PM) <span class="fine">Bar = P${pct} · Whisker = P95</span></div>
            ${fullBarSvg(leg.pmCurve, pmHour, pct, color)}
          </div>
        </div>

        <div class="fp-bottom-grid">
          <div>
            <div class="k">7-Day Congestion Matrix (AM + PM P80)</div>
            <div class="ciq-week fp-week">${leg.weekly.map((d) => `<div style="background:${heatBg(d.totalP80, wkMin, wkMax)}"><span>${d.short}</span><b>${d.totalP80}m</b><small>${d.am.p80Minutes}m + ${d.pm.p80Minutes}m</small></div>`).join('')}</div>
          </div>
          <div>
            <div class="k row">Arrival Confidence Calculator <label class="ciq-time">Arrive by <input type="time" class="fp-target" value="${targetArrival}"></label></div>
            <div class="ciq-arr-grid">
              <div><span>50% on-time</span><b>${arr.p50Leave}</b></div>
              <div class="hi"><span>80% reliable</span><b>${arr.p80Leave}</b></div>
              <div><span>95% safe (+${arr.bufferMin}m)</span><b>${arr.p95Leave}</b></div>
            </div>
          </div>
        </div>

        <div class="fp-alts">
          <div class="k">Route Corridors (${leg.amAlternatives.length})</div>
          ${leg.amAlternatives.map((r) => `<div class="ciq-alt"><span><b>${esc(r.label)}</b> · ${r.distKm} km</span><b>Free ${r.freeFlowMinutes}m · P50 ${r.medianMinutes}m · P80 ${r.p80Minutes}m · P95 ${r.p95Minutes}m</b></div>`).join('')}
        </div>
      </section>`;
    }).join('');

    const rentSummary = Object.entries(society.prices || {}).slice(0, 3).map(([b, p]) => {
      const v = p.rent?.median || p.rent_last_seen?.value || p.rent_est?.value;
      return v ? `${b} BHK: ${p.rent ? '' : '~'}${formatINR(v)}/mo` : null;
    }).filter(Boolean).join(' · ');

    root.innerHTML = `
      <header class="fp-header">
        <div class="brand">
          <img class="brand-logo" src="/favicon.svg" alt="RentVent logo" width="34" height="34">
          <div>
            <div class="k">RentVent × CommuteIQ · Full-Screen Traffic Analysis</div>
            <h1>${esc(society.name)} <span class="fp-loc">${esc(society.locality || '')}</span></h1>
            ${rentSummary ? `<div class="fine">${esc(rentSummary)}</div>` : ''}
          </div>
        </div>
        <div class="fp-actions">
          <div class="seg small" id="fp-pct">
            ${[50, 75, 80, 90, 95].map((p) => `<button data-p="${p}" class="${p === pct ? 'on' : ''}">P${p}</button>`).join('')}
          </div>
          <a class="ghost" href="/?city=${esc(cityId)}&open=${esc(society.id)}">← Back to Map</a>
        </div>
      </header>

      <div class="fp-summary">
        <div class="fp-stat hi"><span>Total Daily Commute (P${pct})</span><b>${totalHuman}/day</b><small>${esc(summary.verdict)}</small></div>
        <div class="fp-stat"><span>Weekly Burden</span><b>${summary.totalWeeklyHours} hrs/wk</b><small>5 working days</small></div>
        <div class="fp-stat"><span>Annual Time in Traffic</span><b>${summary.totalAnnualHours} hrs/yr</b><small>~${Math.round(summary.totalAnnualHours / 24)} full days/yr</small></div>
        <div class="fp-stat"><span>Estimated Monthly Fuel</span><b>₹${summary.totalFuelINR.toLocaleString()}/mo</b><small>22 workdays · ₹102/L</small></div>
      </div>

      ${legSections}
    `;

    root.querySelectorAll('#fp-pct button').forEach((b) => {
      b.onclick = () => { pct = +b.dataset.p; paint(); };
    });
    root.querySelectorAll('.fp-target').forEach((inp) => {
      inp.onchange = () => { targetArrival = inp.value || '09:30'; paint(); };
    });
  };
  paint();
}
