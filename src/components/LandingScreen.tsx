import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { UserSettings } from '@/data/routine';
import SettingsDrawer from './SettingsDrawer';

interface TodayProgressSummary {
  dayIndex: number;
  completed: number;
  completedRaw: number;
  target: number;
  isTargetMet: boolean;
  extraSessions: number;
}

interface LandingScreenProps {
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
  onStart: () => void;
  hasExistingSession: boolean;
  onResume: () => void;
  todayProgress: TodayProgressSummary;
  streak: number;
  progressStartDate: string;
  onSetProgramStartDate: (dateYmd: string) => void;
  onResetProgress: () => void;
  pwaInstallAvailable: boolean;
  onInstallApp: () => void;
  showIosInstallHint: boolean;
  onDismissIosInstallHint: () => void;
  wakeLockSupported: boolean;
}

export default function LandingScreen({
  settings,
  onSettingsChange,
  onStart,
  hasExistingSession,
  onResume,
  todayProgress,
  streak,
  progressStartDate,
  onSetProgramStartDate,
  onResetProgress,
  pwaInstallAvailable,
  onInstallApp,
  showIosInstallHint,
  onDismissIosInstallHint,
  wakeLockSupported,
}: LandingScreenProps) {
  const progressRatio = Math.min(1, todayProgress.target > 0 ? todayProgress.completed / todayProgress.target : 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 noise-overlay relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(240,30%,12%)] via-background to-[hsl(174,30%,8%)] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 cinematic-enter stagger-children">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center glow-primary">
            <span className="text-2xl font-bold text-primary-foreground font-display">K</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light font-display tracking-tight text-foreground leading-tight">
            Knee Rehab
            <br />
            <span className="gradient-text font-medium">Coach</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto font-light">
            A guided routine for your {settings.knee} knee. Calm, focused, at your pace.
          </p>
        </div>

        <div className="glass-panel p-5 text-left space-y-3">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Today</h2>
            <p className="text-sm text-muted-foreground/80 mt-1">Program day {todayProgress.dayIndex}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-foreground/80">
              <span>
                {todayProgress.completed}/{todayProgress.target}
              </span>
              <span>{todayProgress.dayIndex <= 2 ? 'One session today.' : 'Two sessions today.'}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/70 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
            {todayProgress.isTargetMet && (
              <p className="text-sm text-primary flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Target met
              </p>
            )}
            {todayProgress.extraSessions > 0 && (
              <p className="text-xs text-muted-foreground/70">{todayProgress.extraSessions} extra session logged.</p>
            )}
            <p className="text-xs text-muted-foreground/60">Streak: {streak} day{streak === 1 ? '' : 's'}</p>
          </div>
        </div>

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

        <div className="flex items-center justify-center gap-3">
          <SettingsDrawer
            settings={settings}
            onChange={onSettingsChange}
            progressStartDate={progressStartDate}
            onSetProgramStartDate={onSetProgramStartDate}
            onResetProgress={onResetProgress}
            pwaInstallAvailable={pwaInstallAvailable}
            onInstallApp={onInstallApp}
            showIosInstallHint={showIosInstallHint}
            onDismissIosInstallHint={onDismissIosInstallHint}
            wakeLockSupported={wakeLockSupported}
          />
          <Link
            to="/debug/animations"
            className="inline-flex px-3 py-2 rounded-lg bg-secondary/60 text-secondary-foreground text-xs"
          >
            Debug animations
          </Link>
          <Link
            to="/progress"
            className="inline-flex px-3 py-2 rounded-lg bg-secondary/60 text-secondary-foreground text-xs"
          >
            Progress
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/60 font-light">
          Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]">Enter</kbd> to begin · All data stays local
        </p>
      </div>
    </div>
  );
}
