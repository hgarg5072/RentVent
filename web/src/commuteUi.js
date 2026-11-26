// Renders the CommuteIQ traffic & reliability hero panel at the top of a RentVent society card.
import { calculateArrivalWindows, pickPercentile, summarizeHousehold } from './commute.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function hourlyBarSvg(curve, activeHour, pct = 80, color = '#38bdf8') {
  const w = 340, h = 136, padL = 28, padR = 6, padT = 22, padB = 22;
  const maxVal = Math.max(...curve.map((c) => c.p95Minutes), 25);
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const step = plotW / curve.length;
  const barW = Math.max(8, step - 4);
  const yOf = (v) => padT + (1 - v / maxVal) * plotH;

  const gridLines = [0, Math.round(maxVal / 2), maxVal].map((v) => {
    const y = yOf(v).toFixed(1);
    return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="currentColor" opacity=".08"/>
      <text x="${padL - 4}" y="${(+y + 3).toFixed(1)}" text-anchor="end" fill="currentColor" opacity=".55" font-size="9">${v}m</text>`;
  }).join('');

  const bars = curve.map((c, i) => {
    const x = padL + i * step + (step - barW) / 2;
    const isAct = c.hour === activeHour;
    const val = pickPercentile(c, pct);
    const yFree = yOf(c.freeFlowMinutes);
    const yVal = yOf(val);
    const yP95 = yOf(c.p95Minutes);
    const baseY = yOf(0);
    const barColor = isAct ? '#ffd9a0' : color;
    const lbl = c.hour % 3 === 0 ? (c.hour === 12 ? '12p' : c.hour > 12 ? `${c.hour - 12}p` : `${c.hour}a`) : '';

    return `<g>
      <line x1="${(x + barW / 2).toFixed(1)}" y1="${yP95.toFixed(1)}" x2="${(x + barW / 2).toFixed(1)}" y2="${yVal.toFixed(1)}" stroke="${barColor}" stroke-width="1.4" opacity=".55"/>
      <rect x="${x.toFixed(1)}" y="${yVal.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2, baseY - yVal).toFixed(1)}" rx="2.5" fill="${barColor}" opacity="${isAct ? '0.95' : '0.45'}"/>
      <rect x="${x.toFixed(1)}" y="${yFree.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, baseY - yFree).toFixed(1)}" rx="2" fill="${barColor}" opacity="${isAct ? '1' : '0.85'}"/>
      ${isAct ? `<text x="${(x + barW / 2).toFixed(1)}" y="${Math.max(11, yP95 - 5).toFixed(1)}" text-anchor="middle" fill="#ffd9a0" font-size="10.5" font-weight="700">${val}m</text>` : ''}
      ${lbl ? `<text x="${(x + barW / 2).toFixed(1)}" y="${h - 5}" text-anchor="middle" fill="currentColor" opacity="${isAct ? '1' : '.55'}" font-size="9.5" font-weight="${isAct ? '600' : '400'}">${lbl}</text>` : ''}
    </g>`;
  }).join('');

  return `<svg class="ciq-svg" viewBox="0 0 ${w} ${h}" width="100%" height="${h}">${gridLines}${bars}</svg>`;
}

function heatColor(val, min, max) {
  const t = max > min ? (val - min) / (max - min) : 0.5;
  if (t < 0.35) return 'rgba(56, 189, 248, 0.24)';
  if (t < 0.7) return 'rgba(255, 217, 160, 0.30)';
  return 'rgba(255, 120, 100, 0.38)';
}

export function renderCommutePanel(container, { analysis, loading, error, config, onFocusOffice }) {
  if (!container) return;
  const hasOffice = !!(config.office1 || config.office2);
  if (!hasOffice) {
    container.innerHTML = `<div class="ciq-empty">
      <div class="fine">Add an office in the sidebar (or drop a map pin) to see live TomTom traffic, big AM/PM commute times, hourly congestion bars, and arrival confidence here.</div>
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

  const hrs = Math.floor(summary.totalDailyMin / 60);
  const rem = summary.totalDailyMin % 60;
  const totalHuman = hrs ? `${hrs}h ${rem}m` : `${rem} min`;
  const leg0 = summary.perLeg[0];

  const legTabs = analysis.legs.length > 1
    ? `<div class="seg small ciq-tabs">${analysis.legs.map((l, i) => `<button data-leg="${i}" class="${i === 0 ? 'on' : ''}">Office ${i + 1}: ${esc(l.office.short || l.office.name.slice(0, 18))}</button>`).join('')}</div>`
    : '';

  container.innerHTML = `
    <div class="ciq-hero">
      <div class="ciq-hero-main">
        <div class="k">Total Daily Commute (P${pct})</div>
        <div class="ciq-big">${totalHuman}<small>/day</small></div>
        <div class="ciq-hero-sub">
          <span class="badge ${verdictCls}">${esc(summary.verdict)}</span>
          <span>${summary.totalWeeklyHours} hrs/wk · ${summary.totalAnnualHours} hrs/yr · ~₹${summary.totalFuelINR.toLocaleString()}/mo fuel</span>
        </div>
      </div>
      ${summary.perLeg.length === 1 ? `<div class="ciq-hero-legs">
        <div class="ciq-leg-pill"><span>Morning →</span><b>${leg0.amMin} min</b></div>
        <div class="ciq-leg-pill"><span>Evening ←</span><b>${leg0.pmMin} min</b></div>
      </div>` : `<div class="ciq-dual">
        <div><i class="dot o1"></i><span>Office 1</span><b>${summary.perLeg[0].amMin}m → · ${summary.perLeg[0].pmMin}m ←</b><small>${summary.perLeg[0].dailyMin}m/day · ${summary.perLeg[0].dailyKm} km</small></div>
        <div><i class="dot o2"></i><span>Office 2</span><b>${summary.perLeg[1].amMin}m → · ${summary.perLeg[1].pmMin}m ←</b><small>${summary.perLeg[1].dailyMin}m/day · ${summary.perLeg[1].dailyKm} km</small></div>
      </div>`}
    </div>
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
        <span><b>${esc(leg.office.name)}</b> · ${leg.am.distKm} km · ${leg.predictabilityLabel}</span>
        <span class="seg small ciq-dir">
          <button data-d="am" class="${activeDir === 'am' ? 'on' : ''}">AM ${pickPercentile(leg.am, pct)}m</button>
          <button data-d="pm" class="${activeDir === 'pm' ? 'on' : ''}">PM ${pickPercentile(leg.pm, pct)}m</button>
        </span>
      </div>
      <div class="ciq-chart-wrap">
        <div class="k row">Traffic by departure hour <span class="fine">Bar = P${pct} · Top tick = P95</span></div>
        ${hourlyBarSvg(curve, activeHour, pct, color)}
      </div>
      <div class="ciq-ladder">
        <div><span>Free</span><b>${sample.freeFlowMinutes}m</b></div>
        <div><span>Median</span><b>${sample.medianMinutes}m</b></div>
        <div><span>Heavy P75</span><b>${sample.p75Minutes}m</b></div>
        <div class="hi"><span>Reliable P80</span><b>${sample.p80Minutes}m</b></div>
        <div><span>Worst P95</span><b>${sample.p95Minutes}m</b></div>
      </div>
      <div class="ciq-week-wrap">
        <div class="k">Day of week (P80 daily total)</div>
        <div class="ciq-week">${leg.weekly.map((d) => `<div style="background:${heatColor(d.totalP80, wkMin, wkMax)}"><span>${d.short}</span><b>${d.totalP80}m</b></div>`).join('')}</div>
      </div>
      <div class="ciq-arr">
        <div class="k row">When should I leave? <label class="ciq-time">Arrive by <input type="time" id="ciq-target" value="${targetArrival}"></label></div>
        <div class="ciq-arr-grid">
          <div><span>50% on-time</span><b>${arrWin.p50Leave}</b></div>
          <div class="hi"><span>80% reliable</span><b>${arrWin.p80Leave}</b></div>
          <div><span>95% safe (+${arrWin.bufferMin}m)</span><b>${arrWin.p95Leave}</b></div>
        </div>
      </div>
      ${alts?.length ? `<details class="ciq-alts-det"><summary>Alternative routes (${alts.length})</summary><div class="ciq-alts">
        ${alts.map((r) => `<div class="ciq-alt"><span>${esc(r.label)} · ${r.distKm} km</span><b>P50 ${r.medianMinutes}m · P80 ${r.p80Minutes}m · P95 ${r.p95Minutes}m</b></div>`).join('')}
      </div></details>` : ''}
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
