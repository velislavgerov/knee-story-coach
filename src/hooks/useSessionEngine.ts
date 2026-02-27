import { useState, useEffect, useCallback, useRef } from 'react';
import { expandRoutine, Step, UserSettings, defaultSettings, SessionLog } from '@/data/routine';

const STORAGE_KEY = 'knee-rehab-session';
const SETTINGS_KEY = 'knee-rehab-settings';
const LOG_KEY = 'knee-rehab-logs';

interface SessionState {
  stepIndex: number;
  remaining: number;
  repsCount: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  endTimestamp: number | null;
  startedAt: number | null;
}

const initialState: SessionState = {
  stepIndex: 0,
  remaining: 0,
  repsCount: 0,
  status: 'idle',
  endTimestamp: null,
  startedAt: null,
};

function loadState(): SessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(state: SessionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch { return defaultSettings; }
}

export function saveSettings(s: UserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function saveLogs(log: SessionLog) {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const logs: SessionLog[] = raw ? JSON.parse(raw) : [];
    logs.push(log);
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch { /* ignore */ }
}

export function useSessionEngine(settings: UserSettings) {
  const steps = useRef<Step[]>(expandRoutine(settings.bikeRestSeconds));
  const [state, setState] = useState<SessionState>(() => {
    const saved = loadState();
    if (saved && saved.status !== 'completed' && saved.status !== 'idle') {
      // Restore: if was running, compute remaining from endTimestamp
      if (saved.status === 'running' && saved.endTimestamp) {
        const remaining = Math.max(0, Math.ceil((saved.endTimestamp - Date.now()) / 1000));
        return { ...saved, remaining, status: remaining > 0 ? 'paused' : saved.status };
      }
      return { ...saved, status: 'paused' };
    }
    return initialState;
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps.current[state.stepIndex] || null;
  const totalSteps = steps.current.length;

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Regenerate steps when settings change
  useEffect(() => {
    steps.current = expandRoutine(settings.bikeRestSeconds);
  }, [settings.bikeRestSeconds]);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const advanceStep = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.stepIndex + 1;
      if (nextIndex >= steps.current.length) {
        return { ...prev, status: 'completed', endTimestamp: null };
      }
      const nextStep = steps.current[nextIndex];
      const seconds = nextStep.seconds || 0;
      const now = Date.now();
      return {
        ...prev,
        stepIndex: nextIndex,
        remaining: seconds,
        repsCount: 0,
        status: 'running',
        endTimestamp: seconds > 0 ? now + seconds * 1000 : null,
      };
    });
  }, []);

  // Tick loop
  useEffect(() => {
    if (state.status === 'running' && state.endTimestamp) {
      stopTick();
      tickRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.endTimestamp) return prev;
          const remaining = Math.max(0, Math.ceil((prev.endTimestamp - Date.now()) / 1000));
          if (remaining <= 0) {
            return prev; // Will be handled by advanceStep effect
          }
          return { ...prev, remaining };
        });
      }, 100);
      return stopTick;
    } else {
      stopTick();
    }
  }, [state.status, state.endTimestamp, stopTick]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (state.status === 'running' && state.remaining <= 0 && currentStep && currentStep.seconds && currentStep.seconds > 0) {
      advanceStep();
    }
  }, [state.remaining, state.status, currentStep, advanceStep]);

  const start = useCallback(() => {
    if (state.status !== 'idle') return;
    const step = steps.current[0];
    const seconds = step?.seconds || 0;
    const now = Date.now();
    setState({
      stepIndex: 0,
      remaining: seconds,
      repsCount: 0,
      status: 'running',
      endTimestamp: seconds > 0 ? now + seconds * 1000 : null,
      startedAt: now,
    });
  }, [state.status]);

  const pause = useCallback(() => {
    if (state.status !== 'running') return;
    setState(prev => ({
      ...prev,
      status: 'paused',
      endTimestamp: null,
    }));
  }, [state.status]);

  const resume = useCallback(() => {
    if (state.status !== 'paused') return;
    const now = Date.now();
    setState(prev => ({
      ...prev,
      status: 'running',
      endTimestamp: prev.remaining > 0 ? now + prev.remaining * 1000 : null,
    }));
  }, [state.status]);

  const skipRest = useCallback(() => {
    if (currentStep && (currentStep.type === 'rest' || currentStep.type === 'relax')) {
      advanceStep();
    }
  }, [currentStep, advanceStep]);

  const countRep = useCallback(() => {
    if (!currentStep || currentStep.type !== 'reps') return;
    setState(prev => {
      const newCount = prev.repsCount + 1;
      if (newCount >= (currentStep.targetReps || 0)) {
        // Auto-advance after short delay
        const nextIndex = prev.stepIndex + 1;
        if (nextIndex >= steps.current.length) {
          return { ...prev, repsCount: newCount, status: 'completed', endTimestamp: null };
        }
        const nextStep = steps.current[nextIndex];
        const seconds = nextStep.seconds || 0;
        const now = Date.now();
        return {
          ...prev,
          stepIndex: nextIndex,
          remaining: seconds,
          repsCount: 0,
          status: 'running',
          endTimestamp: seconds > 0 ? now + seconds * 1000 : null,
        };
      }
      return { ...prev, repsCount: newCount };
    });
  }, [currentStep]);

  const decrementRep = useCallback(() => {
    setState(prev => ({ ...prev, repsCount: Math.max(0, prev.repsCount - 1) }));
  }, []);

  const goBack = useCallback(() => {
    if (state.status !== 'paused' || state.stepIndex <= 0) return;
    setState(prev => {
      const prevStep = steps.current[prev.stepIndex - 1];
      return {
        ...prev,
        stepIndex: prev.stepIndex - 1,
        remaining: prevStep.seconds || 0,
        repsCount: 0,
        endTimestamp: null,
      };
    });
  }, [state.status, state.stepIndex]);

  const goNext = useCallback(() => {
    advanceStep();
  }, [advanceStep]);

  const reset = useCallback(() => {
    stopTick();
    setState(initialState);
  }, [stopTick]);

  return {
    state,
    currentStep,
    totalSteps,
    steps: steps.current,
    start,
    pause,
    resume,
    skipRest,
    countRep,
    decrementRep,
    goBack,
    goNext,
    reset,
  };
}
