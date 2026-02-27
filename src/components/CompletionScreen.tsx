import { useState } from 'react';
import Confetti from './Confetti';
import { saveLogs } from '@/hooks/useSessionEngine';
import type { SessionLog } from '@/data/routine';
import { RotateCcw, Share2, Check } from 'lucide-react';

interface CompletionScreenProps {
  durationSeconds: number;
  totalExercises: number;
  reducedMotion: boolean;
  onRestart: () => void;
}

export default function CompletionScreen({ durationSeconds, totalExercises, reducedMotion, onRestart }: CompletionScreenProps) {
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

      <div className="absolute inset-0 bg-gradient-to-b from-success/10 via-background to-background pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-success to-primary flex items-center justify-center text-3xl glow-primary">
            🎉
          </div>
          <h1 className="text-4xl font-bold font-display text-foreground">Session Complete!</h1>
          <p className="text-muted-foreground text-lg">Outstanding work. Your knee thanks you.</p>
        </div>

        {/* Summary */}
        <div className="glass-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-display font-bold text-foreground">{mins}<span className="text-lg text-muted-foreground">m</span> {secs}<span className="text-lg text-muted-foreground">s</span></p>
              <p className="text-xs text-muted-foreground">Total time</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-foreground">{totalExercises}</p>
              <p className="text-xs text-muted-foreground">Exercises</p>
            </div>
          </div>
        </div>

        {/* Quick log */}
        {!logged ? (
          <div className="glass-panel p-5 space-y-4 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Log <span className="text-xs normal-case font-normal">(optional)</span></h2>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Pain level: {pain}/10</label>
              <input
                type="range"
                min={0}
                max={10}
                value={pain}
                onChange={(e) => setPain(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Pain level slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>No pain</span><span>Severe</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel?"
                className="w-full bg-secondary border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleLog} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors">
                <Check className="w-4 h-4" /> Save Log
              </button>
              <button onClick={() => setLogged(true)} className="py-2.5 px-4 rounded-xl bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors">
                Skip
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">✓ Log saved</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-display font-semibold flex items-center justify-center gap-2 ripple-btn glow-primary transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" /> Restart
          </button>
          <button
            onClick={handleShare}
            className="py-3.5 px-5 rounded-2xl bg-secondary text-secondary-foreground font-medium flex items-center justify-center gap-2 transition-colors hover:bg-secondary/80"
          >
            <Share2 className="w-4 h-4" /> {shared ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
