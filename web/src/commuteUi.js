// Renders the CommuteIQ traffic & reliability panel inside a RentVent society card.
import { calculateArrivalWindows, pickPercentile, summarizeHousehold } from './commute.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function hourlySvg(curve, activeHour, color = '#38bdf8') {
  const w = 320, h = 92, padL = 26, padR = 8, padT = 8, padB = 18;
  const maxVal = Math.max(...curve.map((c) => c.p95Minutes), 20);
  const xOf = (i) => padL + (i / (curve.length - 1)) * (w - padL - padR);
  const yOf = (v) => padT + (1 - v / maxVal) * (h - padT - padB);

  const p95Pts = curve.map((c, i) => `${xOf(i).toFixed(1)},${yOf(c.p95Minutes).toFixed(1)}`);
  const ffPts = curve.map((c, i) => `${xOf(i).toFixed(1)},${yOf(c.freeFlowMinutes).toFixed(1)}`);
  const p80Pts = curve.map((c, i) => `${xOf(i).toFixed(1)},${yOf(c.p80Minutes).toFixed(1)}`).join(' ');
  const p50Pts = curve.map((c, i) => `${xOf(i).toFixed(1)},${yOf(c.medianMinutes).toFixed(1)}`).join(' ');
  const bandPath = `M${p95Pts.join(' L')} L${ffPts.reverse().join(' L')} Z`;

  const actIdx = Math.max(0, curve.findIndex((c) => c.hour === activeHour));
  const ax = xOf(actIdx);
  const ay = yOf(curve[actIdx]?.p80Minutes || 0);

  const ticks = [6, 9, 12, 15, 18, 21].map((hr) => {
    const idx = curve.findIndex((c) => c.hour === hr);
    const lbl = hr === 12 ? '12p' : hr > 12 ? `${hr - 12}p` : `${hr}a`;
    return `<text x="${xOf(idx).toFixed(1)}" y="${h - 4}" text-anchor="middle" fill="currentColor" opacity=".55" font-size="9">${lbl}</text>`;
  }).join('');

  return `<svg class="ciq-svg" viewBox="0 0 ${w} ${h}" width="100%" height="${h}">
    <text x="2" y="${padT + 6}" fill="currentColor" opacity=".5" font-size="9">${maxVal}m</text>
    <text x="2" y="${h - padB}" fill="currentColor" opacity=".5" font-size="9">0m</text>
    <path d="${bandPath}" fill="${color}" opacity=".14"/>
    <polyline points="${p80Pts}" fill="none" stroke="${color}" stroke-width="2"/>
    <polyline points="${p50Pts}" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 2" opacity=".75"/>
    <line x1="${ax.toFixed(1)}" y1="${padT}" x2="${ax.toFixed(1)}" y2="${h - padB}" stroke="currentColor" opacity=".25" stroke-dasharray="2 2"/>
    <circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.2"/>
    ${ticks}
  </svg>`;
}

function heatColor(val, min, max) {
  const t = max > min ? (val - min) / (max - min) : 0.5;
  if (t < 0.35) return 'rgba(56, 189, 248, 0.22)';
  if (t < 0.7) return 'rgba(255, 217, 160, 0.28)';
  return 'rgba(255, 120, 100, 0.36)';
}

export function renderCommutePanel(container, { analysis, loading, error, config, onFocusOffice }) {
  if (!container) return;
  const hasOffice = !!(config.office1 || config.office2);
  if (!hasOffice) {
    container.innerHTML = `<div class="ciq-empty">
      <div class="fine">Add an office location in the left sidebar to see live TomTom routes, P50–P95 traffic reliability, hourly curves, and arrival confidence for this society.</div>
      <button class="preset" id="ciq-focus-off">Set office location →</button>
    </div>`;
    const btn = container.querySelector('#ciq-focus-off');
    if (btn && onFocusOffice) btn.onclick = onFocusOffice;
    return;
  }
  if (loading) {
    container.innerHTML = `<div class="ciq-loading">Fetching live TomTom routes &amp; traffic reliability…</div>`;
    return;
  }
  if (error) {
    container.innerHTML = `<div class="ciq-err">Could not load traffic data: ${esc(error)}</div>`;
    return;
  }
  if (!analysis?.legs?.length) return;

  const pct = config.percentile || 80;
  const summary = summarizeHousehold(analysis.legs, pct);
  const verdictCls = summary.verdict.includes('Optimal') || summary.verdict.includes('Good') ? 'match'
    : summary.verdict.includes('Moderate') ? 'likely' : 'no';

  const legTabs = analysis.legs.length > 1
    ? `<div class="seg small ciq-tabs">${analysis.legs.map((l, i) => `<button data-leg="${i}" class="${i === 0 ? 'on' : ''}">Office ${i + 1}: ${esc(l.office.short || l.office.name.slice(0, 18))}</button>`).join('')}</div>`
    : '';

  container.innerHTML = `
    <div class="ciq-head">
      <span class="badge ${verdictCls}">${esc(summary.verdict)}</span>
      <span class="fine">P${pct} planning · ${summary.totalDailyMin}m/day</span>
    </div>
    <div class="ciq-kpis">
      <div><span>Daily (P${pct})</span><b>${summary.totalDailyMin} min</b></div>
      <div><span>Weekly</span><b>${summary.totalWeeklyHours} hrs</b></div>
      <div><span>Annual</span><b>${summary.totalAnnualHours} hrs</b></div>
      <div><span>Est. fuel</span><b>₹${summary.totalFuelINR.toLocaleString()}/mo</b></div>
    </div>
    ${summary.perLeg.length === 2 ? `<div class="ciq-dual">
      <div><i class="dot o1"></i><span>Office 1</span><b>${summary.perLeg[0].amMin}m AM · ${summary.perLeg[0].pmMin}m PM</b><small>${summary.perLeg[0].dailyMin}m/day · ${summary.perLeg[0].dailyKm} km</small></div>
      <div><i class="dot o2"></i><span>Office 2</span><b>${summary.perLeg[1].amMin}m AM · ${summary.perLeg[1].pmMin}m PM</b><small>${summary.perLeg[1].dailyMin}m/day · ${summary.perLeg[1].dailyKm} km</small></div>
      <div class="fine ciq-parity">Partner parity delta: <b>${summary.parityDeltaMin} min/day</b></div>
    </div>` : ''}
    ${legTabs}
    <div id="ciq-leg-detail"></div>
  `;

  let activeLeg = 0;
  let activeDir = 'am';
  let targetArrival = '09:30';

  const drawLeg = () => {
    const leg = analysis.legs[activeLeg];
    const color = activeLeg === 0 ? '#38bdf8' : '#c084fc';
    const sample = activeDir === 'am' ? leg.am : leg.pm;
    const curve = activeDir === 'am' ? leg.amCurve : leg.pmCurve;
    const activeHour = parseInt((activeDir === 'am' ? config.amTime : config.pmTime).split(':')[0], 10) || (activeDir === 'am' ? 8 : 18);
    const alts = activeDir === 'am' ? leg.amAlternatives : leg.pmAlternatives;
    const wkVals = leg.weekly.map((d) => d.totalP80);
    const wkMin = Math.min(...wkVals), wkMax = Math.max(...wkVals);
    const arrWin = calculateArrivalWindows(targetArrival, leg.am);

    const el = container.querySelector('#ciq-leg-detail');
    el.innerHTML = `
      <div class="ciq-subhead">
        <span><b>${esc(leg.office.name)}</b> · ${leg.am.distKm} km · ${leg.predictabilityLabel} (${leg.predictabilityScore}/100)</span>
        <span class="seg small ciq-dir">
          <button data-d="am" class="${activeDir === 'am' ? 'on' : ''}">AM ${leg.am.p80Minutes}m</button>
          <button data-d="pm" class="${activeDir === 'pm' ? 'on' : ''}">PM ${leg.pm.p80Minutes}m</button>
        </span>
      </div>
      <div class="ciq-ladder">
        <div><span>Free</span><b>${sample.freeFlowMinutes}m</b></div>
        <div><span>P50</span><b>${sample.medianMinutes}m</b></div>
        <div><span>P75</span><b>${sample.p75Minutes}m</b></div>
        <div class="hi"><span>P80</span><b>${sample.p80Minutes}m</b></div>
        <div><span>P95</span><b>${sample.p95Minutes}m</b></div>
      </div>
      <div class="ciq-chart-wrap">
        <div class="k row">Hourly curve (6 AM – 10 PM) <span class="fine">Solid P80 · Dashed P50 · Shaded P10–P95</span></div>
        ${hourlySvg(curve, activeHour, color)}
      </div>
      <div class="ciq-week-wrap">
        <div class="k">Weekly congestion (P80 daily total)</div>
        <div class="ciq-week">${leg.weekly.map((d) => `<div style="background:${heatColor(d.totalP80, wkMin, wkMax)}"><span>${d.short}</span><b>${d.totalP80}m</b></div>`).join('')}</div>
      </div>
      <div class="ciq-arr">
        <div class="k row">Arrival confidence <label class="ciq-time">Arrive by <input type="time" id="ciq-target" value="${targetArrival}"></label></div>
        <div class="ciq-arr-grid">
          <div><span>50% on-time</span><b>${arrWin.p50Leave}</b></div>
          <div class="hi"><span>80% reliable</span><b>${arrWin.p80Leave}</b></div>
          <div><span>95% buffer (+${arrWin.bufferMin}m)</span><b>${arrWin.p95Leave}</b></div>
        </div>
      </div>
      ${alts?.length ? `<div class="ciq-alts">
        <div class="k">Routes (${alts.length})</div>
        ${alts.map((r) => `<div class="ciq-alt"><span>${esc(r.label)} · ${r.distKm} km</span><b>P50 ${r.medianMinutes}m · P80 ${r.p80Minutes}m · P95 ${r.p95Minutes}m</b></div>`).join('')}
      </div>` : ''}
    `;

    el.querySelectorAll('.ciq-dir button').forEach((b) => {
      b.onclick = () => { activeDir = b.dataset.d; drawLeg(); };
    });
    const tIn = el.querySelector('#ciq-target');
    if (tIn) tIn.onchange = () => { targetArrival = tIn.value || '09:30'; drawLeg(); };
  };

  container.querySelectorAll('.ciq-tabs button').forEach((b) => {
    b.onclick = () => {
      activeLeg = +b.dataset.leg;
      container.querySelectorAll('.ciq-tabs button').forEach((x) => x.classList.toggle('on', +x.dataset.leg === activeLeg));
      drawLeg();
    };
  });
  drawLeg();
}
