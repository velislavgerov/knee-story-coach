import { Step, exercises, UserSettings } from '@/data/routine';
import ExerciseCanvas from './ExerciseCanvas';
import ProgressBar from './ProgressBar';
import SettingsDrawer from './SettingsDrawer';
import { Pause, Play, SkipForward, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

interface SessionPlayerProps {
  currentStep: Step;
  stepIndex: number;
  totalSteps: number;
  remaining: number;
  repsCount: number;
  status: 'running' | 'paused';
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
  onPause: () => void;
  onResume: () => void;
  onSkipRest: () => void;
  onCountRep: () => void;
  onDecrementRep: () => void;
  onGoBack: () => void;
  onGoNext: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}`;
}

export default function SessionPlayer({
  currentStep, stepIndex, totalSteps, remaining, repsCount, status,
  settings, onSettingsChange,
  onPause, onResume, onSkipRest, onCountRep, onDecrementRep, onGoBack, onGoNext,
}: SessionPlayerProps) {
  const exercise = exercises[currentStep.exerciseIndex];
  const isRest = currentStep.type === 'rest';
  const isRelax = currentStep.type === 'relax';
  const isHold = currentStep.type === 'hold';
  const isReps = currentStep.type === 'reps';
  const isPaused = status === 'paused';

  const stateColor = isRest
    ? 'text-rest'
    : isRelax
    ? 'text-relax'
    : isHold
    ? 'text-hold'
    : 'text-primary';

  const stateBg = isRest
    ? 'from-rest/10 to-transparent'
    : isRelax
    ? 'from-relax/10 to-transparent'
    : isHold
    ? 'from-hold/10 to-transparent'
    : 'from-primary/5 to-transparent';

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${stateBg} noise-overlay`}>
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{exercise.chapter}</p>
          <h2 className="text-lg font-display font-semibold text-foreground truncate">{exercise.title}</h2>
        </div>
        <SettingsDrawer settings={settings} onChange={onSettingsChange} disabled={status === 'running'} />
      </div>

      {/* Progress */}
      <div className="relative z-10 px-4 pb-2">
        <ProgressBar current={stepIndex} total={totalSteps} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4">
        {/* Canvas */}
        {!isRest && !isRelax && (
          <div className="animate-scale-in">
            <ExerciseCanvas
              exerciseId={exercise.id}
              isActive={status === 'running'}
              reducedMotion={settings.reducedMotion}
            />
          </div>
        )}

        {/* State label */}
        <div className={`text-center ${isRest || isRelax ? 'py-8' : ''}`}>
          <span className={`text-sm font-semibold uppercase tracking-widest ${stateColor}`}>
            {isRest ? '☕ Rest' : isRelax ? '💆 Relax' : isHold ? '💪 Hold' : isReps ? '🔢 Reps' : '🏋️ Work'}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Set {currentStep.setIndex + 1} of {currentStep.totalSets}
            {isHold && currentStep.repIndex !== undefined && ` • Rep ${currentStep.repIndex + 1}`}
          </p>
        </div>

        {/* Timer or rep counter */}
        {isReps ? (
          <div className="text-center space-y-4">
            <div className="flex items-center gap-6">
              <button
                onClick={onDecrementRep}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/80 transition-colors"
                aria-label="Decrement rep"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div>
                <span className="text-6xl font-display font-bold text-foreground tabular-nums">
                  {repsCount}
                </span>
                <span className="text-2xl text-muted-foreground font-display">/{currentStep.targetReps}</span>
              </div>
              <button
                onClick={onCountRep}
                className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground glow-primary hover:scale-105 transition-transform active:scale-95"
                aria-label="Count rep"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Tap + to count each rep</p>
          </div>
        ) : (
          <div className={`text-center ${isHold && status === 'running' ? 'pulse-hold' : ''}`}>
            <span className={`text-7xl font-display font-bold tabular-nums ${stateColor}`}>
              {formatTime(remaining)}
            </span>
          </div>
        )}

        {/* Instruction card */}
        <div className="glass-panel p-4 w-full max-w-sm">
          {currentStep.note && (
            <p className="text-accent text-sm font-medium mb-2">⚠️ {currentStep.note}</p>
          )}
          {!isRest && !isRelax && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tips</p>
              <ul className="space-y-1">
                {exercise.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex gap-2">
                    <span className="text-primary">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(isRest || isRelax) && (
            <p className="text-sm text-foreground/70 text-center italic">
              {isRest ? 'Breathe. Shake it out. Next set coming up.' : 'Let the muscle relax completely.'}
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 px-4 pb-8 pt-2">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onGoBack}
            disabled={stepIndex <= 0 || !isPaused}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground disabled:opacity-30 transition-all hover:bg-secondary/80"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {(isRest || isRelax) && (
            <button
              onClick={onSkipRest}
              className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              aria-label="Skip rest"
            >
              <SkipForward className="w-4 h-4 inline mr-1" /> Skip
            </button>
          )}

          <button
            onClick={isPaused ? onResume : onPause}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground glow-primary ripple-btn transition-transform hover:scale-105 active:scale-95"
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-7 h-7 ml-0.5" /> : <Pause className="w-7 h-7" />}
          </button>

          <button
            onClick={onGoNext}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/80 transition-all"
            aria-label="Next step"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          <kbd className="px-1 py-0.5 rounded bg-secondary text-[10px]">Space</kbd> pause/resume &middot;
          <kbd className="px-1 py-0.5 rounded bg-secondary text-[10px] ml-1">←→</kbd> prev/next
        </p>
      </div>
    </div>
  );
}
