import { Step, exercises, UserSettings } from '@/data/routine';
import ExerciseCanvas from './ExerciseCanvas';
import ProgressBar from './ProgressBar';
import SettingsDrawer from './SettingsDrawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pause, Play, SkipForward, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SessionPlayerProps {
  currentStep: Step;
  stepIndex: number;
  totalSteps: number;
  remaining: number;
  repsCount: number;
  status: 'running' | 'paused';
  settings: UserSettings;
  progressStartDate: string;
  onSetProgramStartDate: (dateYmd: string) => void;
  onResetProgress: () => void;
  pwaInstallAvailable: boolean;
  onInstallApp: () => void;
  showIosInstallHint: boolean;
  onDismissIosInstallHint: () => void;
  wakeLockSupported: boolean;
  onSettingsChange: (s: UserSettings) => void;
  onPause: () => void;
  onResume: () => void;
  onSkipRest: () => void;
  onCountRep: () => void;
  onDecrementRep: () => void;
  onGoBack: () => void;
  onGoNext: () => void;
  onPauseAndNavigate: (direction: 'back' | 'next') => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}`;
}

export default function SessionPlayer({
  currentStep,
  stepIndex,
  totalSteps,
  remaining,
  repsCount,
  status,
  settings,
  progressStartDate,
  onSetProgramStartDate,
  onResetProgress,
  pwaInstallAvailable,
  onInstallApp,
  showIosInstallHint,
  onDismissIosInstallHint,
  wakeLockSupported,
  onSettingsChange,
  onPause,
  onResume,
  onSkipRest,
  onCountRep,
  onDecrementRep,
  onGoBack,
  onGoNext,
  onPauseAndNavigate,
}: SessionPlayerProps) {
  const exercise = exercises[currentStep.exerciseIndex];
  const isRest = currentStep.type === 'rest';
  const isRelax = currentStep.type === 'relax';
  const isHold = currentStep.type === 'hold';
  const isReps = currentStep.type === 'reps';
  const isPaused = status === 'paused';
  const [transitioning, setTransitioning] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingDirection, setPendingDirection] = useState<'back' | 'next' | null>(null);

  useEffect(() => {
    setTransitioning(true);
    const timer = window.setTimeout(() => setTransitioning(false), 550);
    return () => window.clearTimeout(timer);
  }, [stepIndex]);

  const stateColor = isRest ? 'text-rest' : isRelax ? 'text-relax' : isHold ? 'text-hold' : 'text-primary';

  const stateBg = isRest
    ? 'from-rest/6 to-transparent'
    : isRelax
    ? 'from-relax/6 to-transparent'
    : isHold
    ? 'from-hold/6 to-transparent'
    : 'from-primary/4 to-transparent';

  const attemptNavigate = (direction: 'back' | 'next') => {
    if (direction === 'back' && stepIndex <= 0) return;

    if (status === 'running') {
      setPendingDirection(direction);
      setShowLeaveDialog(true);
      return;
    }

    if (direction === 'back') onGoBack();
    if (direction === 'next') onGoNext();
  };

  const handlePauseAndGo = () => {
    if (!pendingDirection) return;
    onPauseAndNavigate(pendingDirection);
    setShowLeaveDialog(false);
    setPendingDirection(null);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${stateBg} noise-overlay transition-all duration-700`}>
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex-1">
          <p className="text-xs font-light uppercase tracking-[0.2em] text-muted-foreground">{exercise.chapter}</p>
          <h2 className="text-lg font-display font-medium text-foreground truncate">{exercise.title}</h2>
        </div>
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
      </div>

      <div className="relative z-10 px-5 pb-1">
        <p className="text-sm text-muted-foreground/70 italic font-light">{exercise.narrative}</p>
      </div>

      <div className="relative z-10 px-5 pb-3 pt-2">
        <ProgressBar current={stepIndex} total={totalSteps} />
      </div>

      <div
        className={`relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-4 gap-5 transition-all duration-500 ${
          transitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {!isRest && !isRelax && (
          <div className="cinematic-zoom-in">
            <ExerciseCanvas exerciseId={exercise.id} isActive={status === 'running'} reducedMotion={settings.reducedMotion} />
          </div>
        )}

        <div className={`text-center ${isRest || isRelax ? 'py-10' : ''}`}>
          <span className={`text-xs font-medium uppercase tracking-[0.2em] ${stateColor}`}>
            {isRest ? 'Rest' : isRelax ? 'Release' : isHold ? 'Hold' : isReps ? 'Reps' : 'Work'}
          </span>
          <p className="text-xs text-muted-foreground/60 mt-1.5 font-light">
            Set {currentStep.setIndex + 1} of {currentStep.totalSets}
            {isHold && currentStep.repIndex !== undefined && ` · Rep ${currentStep.repIndex + 1}`}
          </p>
        </div>

        {isReps ? (
          <div className="text-center space-y-4">
            <div className="flex items-center gap-8">
              <button
                onClick={onDecrementRep}
                className="w-12 h-12 rounded-full bg-secondary/70 flex items-center justify-center text-secondary-foreground transition-all duration-300 hover:bg-secondary"
                aria-label="Decrement rep"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div>
                <span className="text-6xl font-display font-light text-foreground tabular-nums">{repsCount}</span>
                <span className="text-2xl text-muted-foreground/50 font-display font-light">/{currentStep.targetReps}</span>
              </div>
              <button
                onClick={onCountRep}
                className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground glow-primary transition-all duration-300 hover:bg-primary active:scale-95"
                aria-label="Count rep"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground/50 font-light">Tap + to count each rep</p>
          </div>
        ) : (
          <div className={`text-center ${isHold && status === 'running' ? 'pulse-hold' : ''}`}>
            <span className={`text-7xl font-display font-light tabular-nums ${stateColor}`}>{formatTime(remaining)}</span>
          </div>
        )}

        <div className="glass-panel p-5 w-full max-w-sm">
          {currentStep.note && <p className="text-accent text-sm font-light mb-2.5">⚠ {currentStep.note}</p>}
          {!isRest && !isRelax && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Guidance</p>
              <ul className="space-y-1">
                {exercise.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-foreground/60 flex gap-2 font-light">
                    <span className="text-primary/60">·</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(isRest || isRelax) && (
            <p className="text-sm text-foreground/50 text-center italic font-light">
              {isRest ? 'Breathe. Let go. The next chapter is coming.' : 'Let the muscle release completely.'}
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 px-5 pb-8 pt-3">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => attemptNavigate('back')}
            disabled={stepIndex <= 0}
            className="w-12 h-12 rounded-full bg-secondary/60 flex items-center justify-center text-secondary-foreground disabled:opacity-20 transition-all duration-500 hover:bg-secondary"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {(isRest || isRelax) && (
            <button
              onClick={onSkipRest}
              className="px-4 py-2 rounded-xl bg-secondary/60 text-secondary-foreground text-sm font-light transition-colors duration-500 hover:bg-secondary"
              aria-label="Skip rest"
            >
              <SkipForward className="w-4 h-4 inline mr-1" /> Skip
            </button>
          )}

          <button
            onClick={isPaused ? onResume : onPause}
            className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground glow-primary transition-all duration-500 hover:bg-primary active:scale-95"
            aria-label={isPaused ? 'Continue' : 'Pause'}
          >
            {isPaused ? <Play className="w-6 h-6 ml-0.5" /> : <Pause className="w-6 h-6" />}
          </button>

          <button
            onClick={() => attemptNavigate('next')}
            className="w-12 h-12 rounded-full bg-secondary/60 flex items-center justify-center text-secondary-foreground transition-all duration-500 hover:bg-secondary"
            aria-label="Next chapter"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-4 font-light">
          <kbd className="px-1 py-0.5 rounded bg-secondary/60 text-[10px]">Space</kbd> pause · continue &middot;
          <kbd className="px-1 py-0.5 rounded bg-secondary/60 text-[10px] ml-1">←→</kbd> prev · next
        </p>
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this step?</AlertDialogTitle>
            <AlertDialogDescription>
              The current step is active. We can pause first and then navigate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingDirection(null);
                setShowLeaveDialog(false);
              }}
            >
              Continue here
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePauseAndGo}>Pause &amp; go</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
