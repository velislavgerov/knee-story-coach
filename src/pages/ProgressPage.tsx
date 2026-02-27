import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getProgramDayIndex,
  getSevenDaySummary,
  getStreak,
  getTodayProgress,
  loadProgress,
} from '@/lib/progress';

function statusClass(status: 'empty' | 'partial' | 'complete'): string {
  if (status === 'complete') return 'bg-primary/80 shadow-[0_0_18px_rgba(70,180,200,0.38)]';
  if (status === 'partial') return 'bg-primary/40';
  return 'bg-secondary/40';
}

export default function ProgressPage() {
  const [progress] = useState(loadProgress);
  const today = useMemo(() => getTodayProgress(progress), [progress]);
  const week = useMemo(() => getSevenDaySummary(progress), [progress]);
  const streak = useMemo(() => getStreak(progress), [progress]);
  const dayIndex = useMemo(() => getProgramDayIndex(progress), [progress]);

  return (
    <div className="min-h-screen noise-overlay bg-gradient-to-b from-background via-background to-secondary/20 px-4 py-6 md:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display text-foreground">Progress</h1>
            <p className="text-sm text-muted-foreground/80">Program day {dayIndex}</p>
          </div>
          <Link to="/" className="px-3 py-2 rounded-lg bg-primary/90 text-primary-foreground text-sm">
            Back
          </Link>
        </header>

        <section className="glass-panel p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Today</h2>
          <p className="text-2xl font-display text-foreground">
            {today.completed}/{today.target}
          </p>
          <p className="text-sm text-muted-foreground/75">
            {today.target === 1 ? 'One session today.' : 'Two sessions today.'}
          </p>
          {today.isTargetMet && <p className="text-sm text-primary">Target met.</p>}
          {today.extraSessions > 0 && (
            <p className="text-xs text-muted-foreground/70">{today.extraSessions} extra session logged.</p>
          )}
        </section>

        <section className="glass-panel p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Last 7 days</h2>
          <div className="grid grid-cols-7 gap-2">
            {week.map((day) => (
              <div key={day.ymd} className="text-center space-y-1">
                <div className="text-[11px] text-muted-foreground/80">{day.label}</div>
                <div className={`h-10 rounded-md ${statusClass(day.status)}`} />
                <div className="text-[10px] text-muted-foreground/70">
                  {day.target > 0 ? `${Math.min(day.completedRaw, day.target)}/${day.target}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-5">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Streak</h2>
          <p className="text-3xl font-display text-foreground mt-2">
            {streak} day{streak === 1 ? '' : 's'}
          </p>
          <p className="text-sm text-muted-foreground/75 mt-1">
            Consecutive days where your daily target was met.
          </p>
        </section>
      </div>
    </div>
  );
}
