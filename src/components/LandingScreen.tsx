import { UserSettings } from '@/data/routine';
import SettingsDrawer from './SettingsDrawer';
import { ChevronRight } from 'lucide-react';

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
      {/* Dusk-to-dawn gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(240,30%,12%)] via-background to-[hsl(174,30%,8%)] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-10 cinematic-enter">
        {/* Logo / Title */}
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center glow-primary">
            <span className="text-2xl font-bold text-primary-foreground font-display">K</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light font-display tracking-tight text-foreground leading-tight">
            Knee Rehab<br />
            <span className="gradient-text font-medium">Coach</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto font-light">
            A guided routine for your {settings.knee} knee. Calm, focused, at your pace.
          </p>
        </div>

        {/* Routine summary */}
        <div className="glass-panel p-6 text-left space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Today's routine</h2>
          <ul className="space-y-2 text-sm text-foreground/70">
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
                className="w-full py-4 rounded-2xl bg-primary/90 text-primary-foreground font-display font-medium text-lg flex items-center justify-center gap-2 glow-primary transition-all duration-500 hover:bg-primary active:scale-[0.99]"
                aria-label="Continue session"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={onStart}
                className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-light text-sm transition-colors duration-500 hover:bg-secondary/80"
              >
                Start fresh
              </button>
            </>
          ) : (
            <button
              onClick={onStart}
              className="w-full py-4 rounded-2xl bg-primary/90 text-primary-foreground font-display font-medium text-lg flex items-center justify-center gap-2 glow-primary transition-all duration-500 hover:bg-primary active:scale-[0.99]"
              aria-label="Begin session"
            >
              Begin <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="flex justify-center">
          <SettingsDrawer settings={settings} onChange={onSettingsChange} />
        </div>

        <p className="text-xs text-muted-foreground/60 font-light">
          Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">Enter</kbd> to begin · All data stays local
        </p>
      </div>
    </div>
  );
}
