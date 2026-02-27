import { useState } from 'react';
import Confetti from './Confetti';
import { saveLogs } from '@/hooks/useSessionEngine';
import type { SessionLog } from '@/data/routine';
import { RotateCcw, Share2, Check } from 'lucide-react';

interface TodayStatus {
  completed: number;
  target: number;
  isTargetMet: boolean;
  extraSessions: number;
}

interface CompletionScreenProps {
  durationSeconds: number;
  totalExercises: number;
  reducedMotion: boolean;
  todayStatus: TodayStatus;
  onSaveSessionMeta: (pain: number | null, notes: string | null) => void;
  onRestart: () => void;
}

export default function CompletionScreen({
  durationSeconds,
  totalExercises,
  reducedMotion,
  todayStatus,
  onSaveSessionMeta,
  onRestart,
}: CompletionScreenProps) {
  const [pain, setPain] = useState(0);
  const [notes, setNotes] = useState('');
  const [logged, setLogged] = useState(false);
  const [shared, setShared] = useState(false);

  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;

  const handleLog = () => {
    const log: SessionLog = {
      completedAt: new Date().toISOString(),
      durationSeconds,
      pain,
      notes: notes || undefined,
    };
    saveLogs(log);
    onSaveSessionMeta(pain, notes || null);
    setLogged(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 noise-overlay relative overflow-hidden">
      <Confetti active={true} reducedMotion={reducedMotion} />

      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(174,40%,8%)] via-background to-background pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 cinematic-enter">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center glow-primary">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="text-4xl font-light font-display text-foreground">Session complete</h1>
          <p className="text-muted-foreground/70 text-lg font-light">Well done. Your knee thanks you.</p>
        </div>

        <div className="glass-panel p-6 space-y-3 text-left">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Today</h2>
          <p className="text-lg font-display text-foreground">
            You've done {todayStatus.completed}/{todayStatus.target} today
          </p>
          {todayStatus.isTargetMet && <p className="text-sm text-primary">You're done for today.</p>}
          {todayStatus.extraSessions > 0 && (
            <p className="text-xs text-muted-foreground/70">{todayStatus.extraSessions} extra session logged.</p>
          )}
        </div>

        <div className="glass-panel p-6 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-display font-light text-foreground">
                {mins}
                <span className="text-lg text-muted-foreground/50">m</span> {secs}
                <span className="text-lg text-muted-foreground/50">s</span>
              </p>
              <p className="text-xs text-muted-foreground/50 font-light">Total time</p>
            </div>
            <div>
              <p className="text-3xl font-display font-light text-foreground">{totalExercises}</p>
              <p className="text-xs text-muted-foreground/50 font-light">Chapters</p>
            </div>
          </div>
        </div>

        {!logged ? (
          <div className="glass-panel p-6 space-y-4 text-left">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
              Quick log <span className="text-xs normal-case font-light">(optional)</span>
            </h2>
            <div>
              <label className="text-sm font-light text-foreground/80 block mb-2">Pain level: {pain}/10</label>
              <input
                type="range"
                min={0}
                max={10}
                value={pain}
                onChange={(e) => setPain(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Pain level slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground/40 mt-1 font-light">
                <span>No pain</span>
                <span>Severe</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-light text-foreground/80 block mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel?"
                className="w-full bg-secondary/60 border-border/30 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all duration-300"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLog}
                className="flex-1 py-2.5 rounded-xl bg-primary/90 text-primary-foreground font-light text-sm flex items-center justify-center gap-1.5 transition-all duration-300 hover:bg-primary"
              >
                <Check className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => {
                  onSaveSessionMeta(null, null);
                  setLogged(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-secondary/60 text-secondary-foreground text-sm font-light transition-colors duration-300 hover:bg-secondary"
              >
                Skip
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50 font-light">✓ Log saved</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 rounded-2xl bg-primary/90 text-primary-foreground font-display font-medium flex items-center justify-center gap-2 glow-primary transition-all duration-500 hover:bg-primary active:scale-[0.99]"
          >
            <RotateCcw className="w-4 h-4" /> Begin again
          </button>
          <button
            onClick={handleShare}
            className="py-3.5 px-5 rounded-2xl bg-secondary/60 text-secondary-foreground font-light flex items-center justify-center gap-2 transition-colors duration-500 hover:bg-secondary"
          >
            <Share2 className="w-4 h-4" /> {shared ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
