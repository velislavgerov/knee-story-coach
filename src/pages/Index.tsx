import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { exercises, UserSettings } from '@/data/routine';
import { useSessionEngine, loadSettings, saveSettings } from '@/hooks/useSessionEngine';
import { useSoundCues } from '@/hooks/useSoundCues';
import { useWakeLock } from '@/hooks/useWakeLock';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import {
  appendCompletedSession,
  ensureProgramStartDate,
  getStreak,
  getTodayProgress,
  loadProgress,
  resetProgress,
  setProgramStartDate,
  updateProgressSession,
} from '@/lib/progress';
import LandingScreen from '@/components/LandingScreen';
import SessionPlayer from '@/components/SessionPlayer';
import CompletionScreen from '@/components/CompletionScreen';

const Index = () => {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [progress, setProgress] = useState(loadProgress);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  const engine = useSessionEngine(settings);
  const wakeLock = useWakeLock(engine.state.status === 'running');
  const pwaInstall = usePwaInstall();

  const { playTransition, playTick } = useSoundCues({
    enabled: settings.soundOn,
    reducedMotion: settings.reducedMotion,
  });

  const todayProgress = useMemo(() => getTodayProgress(progress), [progress]);
  const streak = useMemo(() => getStreak(progress), [progress]);

  const handleSettingsChange = useCallback((next: UserSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const handleSetProgramStartDate = useCallback((dateYmd: string) => {
    if (!dateYmd) return;
    const next = setProgramStartDate(dateYmd);
    setProgress(next);
  }, []);

  const handleResetProgress = useCallback(() => {
    setProgress(resetProgress());
  }, []);

  const handleStart = useCallback(() => {
    const ensured = ensureProgramStartDate(loadProgress());
    setProgress(ensured);

    if (engine.state.status !== 'idle') {
      if (!confirm('Start a new session? Current progress will be lost.')) return;
      engine.reset();
      setTimeout(() => engine.start(), 50);
      return;
    }

    engine.start();
  }, [engine]);

  const handleResume = useCallback(() => {
    if (engine.state.status === 'paused') {
      engine.resume();
    }
  }, [engine]);

  const handlePauseAndNavigate = useCallback(
    (direction: 'back' | 'next') => {
      if (engine.state.status === 'running') {
        engine.pause();
      }
      if (direction === 'back') {
        engine.goBack();
      } else {
        engine.goNext();
      }
    },
    [engine],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (engine.state.status === 'running') engine.pause();
          else if (engine.state.status === 'paused') engine.resume();
          break;
        case 'Enter':
          if (engine.state.status === 'idle') handleStart();
          break;
        case 'ArrowRight':
          if (engine.state.status === 'paused') engine.goNext();
          break;
        case 'ArrowLeft':
          if (engine.state.status === 'paused') engine.goBack();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engine, handleStart]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !settings.reducedMotion) {
      const updated = { ...settings, reducedMotion: true };
      setSettings(updated);
      saveSettings(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previousStepIndexRef = useRef(engine.state.stepIndex);
  const previousRemainingRef = useRef(engine.remaining);
  const previousStatusRef = useRef(engine.state.status);

  useEffect(() => {
    if (engine.state.stepIndex !== previousStepIndexRef.current && engine.state.status !== 'idle') {
      playTransition();
      previousStepIndexRef.current = engine.state.stepIndex;
    }
  }, [engine.state.stepIndex, engine.state.status, playTransition]);

  useEffect(() => {
    const current = engine.remaining;
    if (engine.state.status === 'running' && current > 0 && current <= 3 && current !== previousRemainingRef.current) {
      playTick();
    }
    previousRemainingRef.current = current;
  }, [engine.remaining, engine.state.status, playTick]);

  useEffect(() => {
    const previous = previousStatusRef.current;
    const now = Date.now();

    if (previous !== 'completed' && engine.state.status === 'completed') {
      const completedAt = new Date(now).toISOString();
      const startedAt = engine.state.startedAt ? new Date(engine.state.startedAt).toISOString() : completedAt;
      const durationSeconds = engine.state.startedAt ? Math.max(0, Math.round((now - engine.state.startedAt) / 1000)) : 0;
      const { progress: nextProgress, session } = appendCompletedSession({
        startedAt,
        completedAt,
        durationSeconds,
        pain: null,
        notes: null,
      });
      setProgress(nextProgress);
      setCompletedSessionId(session.id);
    }

    if (engine.state.status !== 'completed') {
      setCompletedSessionId(null);
    }

    previousStatusRef.current = engine.state.status;
  }, [engine.state.status, engine.state.startedAt]);

  const handleSaveSessionMeta = useCallback(
    (pain: number | null, notes: string | null) => {
      if (!completedSessionId) return;
      const next = updateProgressSession(completedSessionId, { pain, notes });
      setProgress(next);
    },
    [completedSessionId],
  );

  const sessionDuration = engine.state.startedAt ? Math.floor((Date.now() - engine.state.startedAt) / 1000) : 0;

  if (engine.state.status === 'completed') {
    return (
      <CompletionScreen
        durationSeconds={sessionDuration}
        totalExercises={exercises.length}
        reducedMotion={settings.reducedMotion}
        todayStatus={{
          completed: todayProgress.completed,
          target: todayProgress.target,
          isTargetMet: todayProgress.isTargetMet,
          extraSessions: todayProgress.extraSessions,
        }}
        onSaveSessionMeta={handleSaveSessionMeta}
        onRestart={() => {
          engine.reset();
        }}
      />
    );
  }

  if (engine.state.status === 'idle') {
    return (
      <LandingScreen
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onStart={handleStart}
        hasExistingSession={false}
        onResume={handleResume}
        todayProgress={todayProgress}
        streak={streak}
        progressStartDate={progress.programStartDate || ''}
        onSetProgramStartDate={handleSetProgramStartDate}
        onResetProgress={handleResetProgress}
        pwaInstallAvailable={pwaInstall.canInstall}
        onInstallApp={pwaInstall.install}
        showIosInstallHint={pwaInstall.showIosHint}
        onDismissIosInstallHint={pwaInstall.dismissIosHint}
        wakeLockSupported={wakeLock.supported}
      />
    );
  }

  if (!engine.currentStep) return null;

  const showLanding =
    engine.state.status === 'paused' &&
    engine.state.stepIndex === 0 &&
    engine.remaining === Math.ceil(((engine.currentStep.seconds || 0) * 1000) / 1000);

  if (showLanding) {
    return (
      <LandingScreen
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onStart={handleStart}
        hasExistingSession={true}
        onResume={handleResume}
        todayProgress={todayProgress}
        streak={streak}
        progressStartDate={progress.programStartDate || ''}
        onSetProgramStartDate={handleSetProgramStartDate}
        onResetProgress={handleResetProgress}
        pwaInstallAvailable={pwaInstall.canInstall}
        onInstallApp={pwaInstall.install}
        showIosInstallHint={pwaInstall.showIosHint}
        onDismissIosInstallHint={pwaInstall.dismissIosHint}
        wakeLockSupported={wakeLock.supported}
      />
    );
  }

  return (
    <SessionPlayer
      currentStep={engine.currentStep}
      stepIndex={engine.state.stepIndex}
      totalSteps={engine.totalSteps}
      remaining={engine.remaining}
      repsCount={engine.repsCount}
      status={engine.state.status as 'running' | 'paused'}
      settings={settings}
      progressStartDate={progress.programStartDate || ''}
      onSetProgramStartDate={handleSetProgramStartDate}
      onResetProgress={handleResetProgress}
      pwaInstallAvailable={pwaInstall.canInstall}
      onInstallApp={pwaInstall.install}
      showIosInstallHint={pwaInstall.showIosHint}
      onDismissIosInstallHint={pwaInstall.dismissIosHint}
      wakeLockSupported={wakeLock.supported}
      onSettingsChange={handleSettingsChange}
      onPause={engine.pause}
      onResume={engine.resume}
      onSkipRest={engine.skipRest}
      onCountRep={engine.countRep}
      onDecrementRep={engine.decrementRep}
      onGoBack={engine.goBack}
      onGoNext={engine.goNext}
      onPauseAndNavigate={handlePauseAndNavigate}
    />
  );
};

export default Index;
