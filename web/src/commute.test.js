import { describe, expect, it } from 'vitest';
import {
  buildOfficeLegAnalysis,
  calculateArrivalWindows,
  calculatePercentiles,
  generateHourlyCommuteCurve,
  generateWeeklyHeatmap,
  haversineKm,
  officeScoreKm,
  summarizeHousehold,
} from './commute.js';

describe('commute percentiles', () => {
  it('computes monotonically increasing P10 <= P50 <= P75 <= P80 <= P90 <= P95', () => {
    const p = calculatePercentiles(1200, 2400); // 20m free-flow, 40m expected
    expect(p.freeFlowMinutes).toBeLessThanOrEqual(p.medianMinutes);
    expect(p.medianMinutes).toBe(40);
    expect(p.p75Minutes).toBeGreaterThan(p.medianMinutes);
    expect(p.p80Minutes).toBeGreaterThanOrEqual(p.p75Minutes);
    expect(p.p90Minutes).toBeGreaterThan(p.p80Minutes);
    expect(p.p95Minutes).toBeGreaterThan(p.p90Minutes);
    expect(p.congestionMultiplier).toBe(2);
  });
});

describe('hourly & weekly commute curves', () => {
  it('generates 17 hourly points from 6 AM to 10 PM with morning rush peak', () => {
    const curve = generateHourlyCommuteCurve('inbound', 20, 25, 'Wednesday');
    expect(curve).toHaveLength(17);
    const h6 = curve.find((c) => c.hour === 6);
    const h9 = curve.find((c) => c.hour === 9);
    expect(h9.medianMinutes).toBeGreaterThan(h6.medianMinutes);
  });

  it('weekly heatmap reflects higher Wednesday congestion than Sunday', () => {
    const wk = generateWeeklyHeatmap(18, 22, 18, 28, 8, 18);
    expect(wk).toHaveLength(7);
    const wed = wk.find((d) => d.day === 'Wednesday');
    const sun = wk.find((d) => d.day === 'Sunday');
    expect(wed.totalP80).toBeGreaterThan(sun.totalP80);
  });
});

describe('arrival confidence & household summary', () => {
  it('calculates leave-by times with earlier P95 than P50', () => {
    const sample = calculatePercentiles(1200, 2100);
    const win = calculateArrivalWindows('09:30', sample);
    expect(win.targetLabel).toBe('9:30 AM');
    expect(win.p50Leave).toBe('8:55 AM');
    expect(win.bufferMin).toBeGreaterThan(0);
  });

  it('summarizes dual-office household commute and parity delta', () => {
    const mkRoute = (ff, exp, km) => [{ distKm: km, ...calculatePercentiles(ff, exp), coordinates: [] }];
    const leg1 = buildOfficeLegAnalysis({ name: 'Office 1' }, mkRoute(900, 1500, 10), mkRoute(900, 1800, 10));
    const leg2 = buildOfficeLegAnalysis({ name: 'Office 2' }, mkRoute(1200, 2400, 15), mkRoute(1200, 2700, 15));
    const summary = summarizeHousehold([leg1, leg2], 80);
    expect(summary.perLeg).toHaveLength(2);
    expect(summary.totalDailyMin).toBe(summary.perLeg[0].dailyMin + summary.perLeg[1].dailyMin);
    expect(summary.parityDeltaMin).toBeGreaterThan(0);
    expect(summary.totalFuelINR).toBeGreaterThan(0);
  });

  it('scores dual-office proximity using bias weight', () => {
    const soc = { lat: 12.92, lng: 77.66 };
    const o1 = { lat: 12.98, lng: 77.69 };
    const o2 = { lat: 12.84, lng: 77.65 };
    expect(haversineKm(soc, o1)).toBeGreaterThan(5);
    const favor1 = officeScoreKm(soc, o1, o2, 0);
    const favor2 = officeScoreKm(soc, o1, o2, 100);
    expect(favor1).toBeCloseTo(haversineKm(soc, o1), 4);
    expect(favor2).toBeCloseTo(haversineKm(soc, o2), 4);
  });
});
