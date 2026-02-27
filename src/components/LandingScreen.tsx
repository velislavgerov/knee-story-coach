import { UserSettings } from '@/data/routine';
import SettingsDrawer from './SettingsDrawer';
import { Play } from 'lucide-react';

interface LandingScreenProps {
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
  onStart: () => void;
  hasExistingSession: boolean;
  onResume: () => void;
}

export default function LandingScreen({ settings, onSettingsChange, onStart, hasExistingSession, onResume }: LandingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 noise-overlay relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Logo / Title */}
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <span className="text-2xl font-bold text-primary-foreground font-display">K</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
            Knee Rehab<br />
            <span className="gradient-text">Coach</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
            A guided, step-by-step rehabilitation routine for your {settings.knee} knee.
          </p>
        </div>

        {/* Routine summary */}
        <div className="glass-panel p-5 text-left space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's Routine</h2>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            <li className="flex justify-between"><span>1. Stationary Bike</span><span className="text-muted-foreground">5 × 1 min</span></li>
            <li className="flex justify-between"><span>2. Knee Extension</span><span className="text-muted-foreground">3 × 1 min</span></li>
            <li className="flex justify-between"><span>3. Straight Leg Raise</span><span className="text-muted-foreground">5 × 20 reps</span></li>
            <li className="flex justify-between"><span>4. Step-Ups</span><span className="text-muted-foreground">3 × 1 min</span></li>
            <li className="flex justify-between"><span>5. Inner Thigh</span><span className="text-muted-foreground">3 × 15 reps</span></li>
            <li className="flex justify-between"><span>6. Quad Squeeze</span><span className="text-muted-foreground">10 × 15s hold</span></li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {hasExistingSession ? (
            <>
              <button
                onClick={onResume}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-display font-semibold text-lg flex items-center justify-center gap-2 ripple-btn glow-primary transition-transform hover:scale-[1.02] active:scale-[0.98]"
                aria-label="Resume session"
              >
                <Play className="w-5 h-5" /> Resume Session
              </button>
              <button
                onClick={onStart}
                className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm transition-colors hover:bg-secondary/80"
              >
                Start New Session
              </button>
            </>
          ) : (
            <button
              onClick={onStart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-display font-semibold text-lg flex items-center justify-center gap-2 ripple-btn glow-primary transition-transform hover:scale-[1.02] active:scale-[0.98]"
              aria-label="Start session"
            >
              <Play className="w-5 h-5" /> Start Session
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="flex justify-center">
          <SettingsDrawer settings={settings} onChange={onSettingsChange} />
        </div>

        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">Enter</kbd> to start &middot; All data stays local
        </p>
      </div>
    </div>
  );
}
