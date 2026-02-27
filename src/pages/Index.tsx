import { useState, useEffect, useCallback } from 'react';
import { UserSettings, defaultSettings } from '@/data/routine';
import { useSessionEngine, loadSettings, saveSettings } from '@/hooks/useSessionEngine';
import LandingScreen from '@/components/LandingScreen';
import SessionPlayer from '@/components/SessionPlayer';
import CompletionScreen from '@/components/CompletionScreen';
import { exercises } from '@/data/routine';

const Index = () => {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const engine = useSessionEngine(settings);

  const handleSettingsChange = useCallback((s: UserSettings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  const handleStart = useCallback(() => {
    if (engine.state.status !== 'idle') {
      if (!confirm('Start a new session? Current progress will be lost.')) return;
      engine.reset();
      // Small delay to let reset take effect
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

  // Keyboard shortcuts
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

  // Completion duration
  const sessionDuration = engine.state.startedAt
    ? Math.floor((Date.now() - engine.state.startedAt) / 1000)
    : 0;

  if (engine.state.status === 'completed') {
    return (
      <CompletionScreen
        durationSeconds={sessionDuration}
        totalExercises={exercises.length}
        reducedMotion={settings.reducedMotion}
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
      />
    );
  }

  if (!engine.currentStep) return null;

  // Check if there's a paused session to show resume on landing
  const showLanding = engine.state.status === 'paused' && engine.state.stepIndex === 0 && engine.state.remaining === (engine.currentStep.seconds || 0);

  if (showLanding) {
    return (
      <LandingScreen
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onStart={handleStart}
        hasExistingSession={true}
        onResume={handleResume}
      />
    );
  }

  return (
    <SessionPlayer
      currentStep={engine.currentStep}
      stepIndex={engine.state.stepIndex}
      totalSteps={engine.totalSteps}
      remaining={engine.state.remaining}
      repsCount={engine.state.repsCount}
      status={engine.state.status as 'running' | 'paused'}
      settings={settings}
      onSettingsChange={handleSettingsChange}
      onPause={engine.pause}
      onResume={engine.resume}
      onSkipRest={engine.skipRest}
      onCountRep={engine.countRep}
      onDecrementRep={engine.decrementRep}
      onGoBack={engine.goBack}
      onGoNext={engine.goNext}
    />
  );
};

export default Index;
