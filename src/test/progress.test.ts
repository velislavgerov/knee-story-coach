import { describe, expect, it } from 'vitest';
import {
  ProgressState,
  getDailyTarget,
  getStreak,
  getTodayProgress,
  toLocalYmd,
} from '@/lib/progress';

function buildProgress(startDate: Date): ProgressState {
  return {
    programStartDate: toLocalYmd(startDate),
    sessions: [],
  };
}

describe('progress ramp-up', () => {
  it('uses target 1 on day 1-2 and 2 on day 3+', () => {
    const day1 = new Date(2026, 1, 27);
    const day2 = new Date(2026, 1, 28);
    const day3 = new Date(2026, 2, 1);
    const progress = buildProgress(day1);

    expect(getDailyTarget(progress, day1)).toBe(1);
    expect(getDailyTarget(progress, day2)).toBe(1);
    expect(getDailyTarget(progress, day3)).toBe(2);
  });

  it('caps display count and reports extra sessions', () => {
    const base = new Date(2026, 1, 27);
    const today = new Date(2026, 2, 1); // day 3
    const todayIsoA = new Date(2026, 2, 1, 8, 0).toISOString();
    const todayIsoB = new Date(2026, 2, 1, 12, 0).toISOString();
    const todayIsoC = new Date(2026, 2, 1, 18, 0).toISOString();
    const progress: ProgressState = {
      programStartDate: toLocalYmd(base),
      sessions: [
        { id: 'a', startedAt: todayIsoA, completedAt: todayIsoA, durationSeconds: 120, pain: null, notes: null },
        { id: 'b', startedAt: todayIsoB, completedAt: todayIsoB, durationSeconds: 120, pain: null, notes: null },
        { id: 'c', startedAt: todayIsoC, completedAt: todayIsoC, durationSeconds: 120, pain: null, notes: null },
      ],
    };

    const summary = getTodayProgress(progress, today);
    expect(summary.target).toBe(2);
    expect(summary.completedRaw).toBe(3);
    expect(summary.completed).toBe(2);
    expect(summary.extraSessions).toBe(1);
    expect(summary.isTargetMet).toBe(true);
  });

  it('computes streak based on meeting daily target', () => {
    const today = new Date(2026, 2, 4); // day 6 => target 2
    const start = new Date(2026, 1, 28);
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const iso = (offsetDay: number, hour: number) => new Date(y, m, d - offsetDay, hour, 0).toISOString();

    const progress: ProgressState = {
      programStartDate: toLocalYmd(start),
      sessions: [
        { id: 't1', startedAt: iso(0, 8), completedAt: iso(0, 8), durationSeconds: 60, pain: null, notes: null },
        { id: 't2', startedAt: iso(0, 9), completedAt: iso(0, 9), durationSeconds: 60, pain: null, notes: null },
        { id: 'y1', startedAt: iso(1, 8), completedAt: iso(1, 8), durationSeconds: 60, pain: null, notes: null },
        { id: 'y2', startedAt: iso(1, 9), completedAt: iso(1, 9), durationSeconds: 60, pain: null, notes: null },
        { id: 'b1', startedAt: iso(2, 8), completedAt: iso(2, 8), durationSeconds: 60, pain: null, notes: null },
      ],
    };

    expect(getStreak(progress, today)).toBe(2);
  });
});
