import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { expandRoutine, Step, UserSettings, defaultSettings, SessionLog } from '@/data/routine';

const STORAGE_KEY = 'knee-rehab-session';
const SETTINGS_KEY = 'knee-rehab-settings';
const LOG_KEY = 'knee-rehab-logs';
const TRANSITION_LOCK_MS = 300;
const TICK_PERSIST_THROTTLE_MS = 500;

export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

export type AdvanceReason =
  | 'timerComplete'
  | 'restComplete'
  | 'relaxComplete'
  | 'repTargetReached'
  | 'manualNext'
  | 'manualBack'
  | 'skipRest'
  | 'restoreFastForward';

export interface SessionState {
  status: SessionStatus;
  stepIndex: number;
  stepStartedAt: number | null;
  stepEndsAt: number | null;
  remainingMs: number;
  repCount: number;
  startedAt: number | null;
  transitionLockUntil: number | null;
}

type LegacySessionState = {
  stepIndex?: number;
  remaining?: number;
  repsCount?: number;
  status?: SessionStatus;
  endTimestamp?: number | null;
  startedAt?: number | null;
};

const initialState: SessionState = {
  status: 'idle',
  stepIndex: 0,
  stepStartedAt: null,
  stepEndsAt: null,
  remainingMs: 0,
  repCount: 0,
  startedAt: null,
  transitionLockUntil: null,
};

function loadRawState(): unknown | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state: SessionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isTimedStep(step: Step | null): boolean {
  return !!step && (step.seconds || 0) > 0;
}

function getStepDurationMs(step: Step | null): number {
  return step ? Math.max(0, (step.seconds || 0) * 1000) : 0;
}

function clampStepIndex(stepIndex: number, steps: Step[]): number {
  if (steps.length === 0) return 0;
  return Math.min(Math.max(stepIndex, 0), steps.length - 1);
}

function parseToState(raw: unknown): SessionState | null {
  if (!raw || typeof raw !== 'object') return null;
  const maybe = raw as Partial<SessionState>;

  if (typeof maybe.remainingMs === 'number') {
    return {
      status: (maybe.status as SessionStatus) || 'idle',
      stepIndex: typeof maybe.stepIndex === 'number' ? maybe.stepIndex : 0,
      stepStartedAt: typeof maybe.stepStartedAt === 'number' ? maybe.stepStartedAt : null,
      stepEndsAt: typeof maybe.stepEndsAt === 'number' ? maybe.stepEndsAt : null,
      remainingMs: Math.max(0, maybe.remainingMs),
      repCount: typeof maybe.repCount === 'number' ? Math.max(0, maybe.repCount) : 0,
      startedAt: typeof maybe.startedAt === 'number' ? maybe.startedAt : null,
      transitionLockUntil: typeof maybe.transitionLockUntil === 'number' ? maybe.transitionLockUntil : null,
    };
  }

  const legacy = raw as LegacySessionState;
  if (typeof legacy.stepIndex === 'number' || typeof legacy.remaining === 'number') {
    const remainingMs = Math.max(0, (legacy.remaining || 0) * 1000);
    return {
      status: legacy.status || 'idle',
      stepIndex: legacy.stepIndex || 0,
      stepStartedAt: null,
      stepEndsAt: typeof legacy.endTimestamp === 'number' ? legacy.endTimestamp : null,
      remainingMs,
      repCount: Math.max(0, legacy.repsCount || 0),
      startedAt: typeof legacy.startedAt === 'number' ? legacy.startedAt : null,
      transitionLockUntil: null,
    };
  }

  return null;
}

function restoreState(parsed: SessionState | null, steps: Step[]): SessionState {
  if (!parsed) return initialState;

  const now = Date.now();
  const restored: SessionState = {
    ...parsed,
    stepIndex: clampStepIndex(parsed.stepIndex, steps),
    remainingMs: Math.max(0, parsed.remainingMs),
    repCount: Math.max(0, parsed.repCount),
    transitionLockUntil: null,
  };

  if (restored.status === 'idle' || restored.status === 'completed') {
    return restored;
  }

  let idx = restored.stepIndex;
  let step = steps[idx] || null;

  if (restored.status === 'running' && isTimedStep(step)) {
    let overflowMs = 0;

    if (typeof restored.stepEndsAt === 'number') {
      const currentRemaining = restored.stepEndsAt - now;
      if (currentRemaining > 0) {
        return {
          ...restored,
          remainingMs: currentRemaining,
        };
      }
      overflowMs = Math.abs(currentRemaining);
    } else {
      if (restored.remainingMs > 0) {
        return {
          ...restored,
          stepEndsAt: now + restored.remainingMs,
          stepStartedAt: now,
        };
      }
      overflowMs = 0;
    }

    idx += 1;
    while (idx < steps.length) {
      step = steps[idx];
      if (!isTimedStep(step)) {
        return {
          ...restored,
          stepIndex: idx,
          stepStartedAt: now,
          stepEndsAt: null,
          remainingMs: 0,
          repCount: 0,
        };
      }

      const durationMs = getStepDurationMs(step);
      if (overflowMs < durationMs) {
        const remainingMs = durationMs - overflowMs;
        return {
          ...restored,
          stepIndex: idx,
          stepStartedAt: now - (durationMs - remainingMs),
          stepEndsAt: now + remainingMs,
          remainingMs,
          repCount: 0,
        };
      }

      overflowMs -= durationMs;
      idx += 1;
    }

    return {
      ...restored,
      status: 'completed',
      stepIndex: Math.max(0, steps.length - 1),
      stepStartedAt: null,
      stepEndsAt: null,
      remainingMs: 0,
      repCount: 0,
    };
  }

  if (restored.status === 'paused' && isTimedStep(step) && restored.remainingMs <= 0) {
    return {
      ...restored,
      remainingMs: getStepDurationMs(step),
      stepEndsAt: null,
    };
  }

  return restored;
}

function makeStepState(
  prev: SessionState,
  steps: Step[],
  stepIndex: number,
  status: 'running' | 'paused',
  now: number,
): SessionState {
  if (stepIndex >= steps.length) {
    return {
      ...prev,
      status: 'completed',
      stepIndex: Math.max(0, steps.length - 1),
      stepStartedAt: null,
      stepEndsAt: null,
      remainingMs: 0,
      repCount: 0,
      transitionLockUntil: now + TRANSITION_LOCK_MS,
    };
  }

  const step = steps[stepIndex];
  const durationMs = getStepDurationMs(step);
  return {
    ...prev,
    status,
    stepIndex,
    stepStartedAt: now,
    stepEndsAt: status === 'running' && durationMs > 0 ? now + durationMs : null,
    remainingMs: durationMs,
    repCount: 0,
    transitionLockUntil: now + TRANSITION_LOCK_MS,
  };
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
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
  } catch {
    // ignore localStorage failures
  }
}

export function useSessionEngine(settings: UserSettings) {
  const steps = useMemo(() => expandRoutine(settings.bikeRestSeconds), [settings.bikeRestSeconds]);
  const [state, setState] = useState<SessionState>(() => {
    const parsed = parseToState(loadRawState());
    return restoreState(parsed, steps);
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPersistTickRef = useRef(0);

  const currentStep = steps[state.stepIndex] || null;
  const totalSteps = steps.length;

  const persistImmediately = useCallback((snapshot: SessionState) => {
    saveState(snapshot);
    lastPersistTickRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status !== 'running') {
      persistImmediately(state);
      return;
    }

    const now = Date.now();
    if (now - lastPersistTickRef.current >= TICK_PERSIST_THROTTLE_MS) {
      persistImmediately(state);
    }
  }, [state, persistImmediately]);

  useEffect(() => {
    setState((prev) => {
      if (prev.status === 'completed') return prev;
      return {
        ...prev,
        stepIndex: clampStepIndex(prev.stepIndex, steps),
      };
    });
  }, [steps]);

  const advanceToNextStep = useCallback(
    (reason: AdvanceReason) => {
      setState((prev) => {
        const now = Date.now();
        if ((prev.transitionLockUntil || 0) > now) return prev;

        const nextState = makeStepState(prev, steps, prev.stepIndex + 1, 'running', now);
        persistImmediately(prev);
        persistImmediately(nextState);
        void reason;
        return nextState;
      });
    },
    [persistImmediately, steps],
  );

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.status === 'running' && state.stepEndsAt) {
      stopTick();
      tickRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.status !== 'running' || !prev.stepEndsAt) return prev;
          const remainingMs = Math.max(0, prev.stepEndsAt - Date.now());
          if (remainingMs === prev.remainingMs) return prev;
          return { ...prev, remainingMs };
        });
      }, 100);

      return stopTick;
    }

    stopTick();
    return undefined;
  }, [state.status, state.stepEndsAt, stopTick]);

  useEffect(() => {
    if (!currentStep || state.status !== 'running' || !isTimedStep(currentStep)) return;
    if (state.remainingMs > 0) return;

    const reason: AdvanceReason =
      currentStep.type === 'rest'
        ? 'restComplete'
        : currentStep.type === 'relax'
        ? 'relaxComplete'
        : 'timerComplete';

    advanceToNextStep(reason);
  }, [state.remainingMs, state.status, currentStep, advanceToNextStep]);

  const start = useCallback(() => {
    setState((prev) => {
      const now = Date.now();
      if (prev.status === 'running') return prev;

      const startedAt = now;
      const base: SessionState = {
        ...initialState,
        startedAt,
      };
      const nextState = makeStepState(base, steps, 0, 'running', now);
      nextState.startedAt = startedAt;
      persistImmediately(prev);
      persistImmediately(nextState);
      return nextState;
    });
  }, [persistImmediately, steps]);

  const pause = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'running') return prev;
      const now = Date.now();
      const remainingMs = prev.stepEndsAt ? Math.max(0, prev.stepEndsAt - now) : prev.remainingMs;
      const nextState: SessionState = {
        ...prev,
        status: 'paused',
        stepEndsAt: null,
        remainingMs,
      };
      persistImmediately(prev);
      persistImmediately(nextState);
      return nextState;
    });
  }, [persistImmediately]);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'paused') return prev;
      const now = Date.now();
      const step = steps[prev.stepIndex] || null;
      const timed = isTimedStep(step);
      const remainingMs = timed ? prev.remainingMs : 0;
      const nextState: SessionState = {
        ...prev,
        status: 'running',
        stepStartedAt: now,
        stepEndsAt: timed && remainingMs > 0 ? now + remainingMs : null,
      };
      persistImmediately(prev);
      persistImmediately(nextState);
      return nextState;
    });
  }, [persistImmediately, steps]);

  const moveToStepPaused = useCallback(
    (computeStepIndex: (prev: SessionState) => number, reason: AdvanceReason) => {
      setState((prev) => {
        const now = Date.now();
        if ((prev.transitionLockUntil || 0) > now) return prev;
        const stepIndex = computeStepIndex(prev);
        if (stepIndex < 0) return prev;

        const nextState = makeStepState(prev, steps, stepIndex, 'paused', now);
        persistImmediately(prev);
        persistImmediately(nextState);
        void reason;
        return nextState;
      });
    },
    [persistImmediately, steps],
  );

  const skipRest = useCallback(() => {
    if (currentStep && (currentStep.type === 'rest' || currentStep.type === 'relax')) {
      advanceToNextStep('skipRest');
    }
  }, [currentStep, advanceToNextStep]);

  const countRep = useCallback(() => {
    setState((prev) => {
      const step = steps[prev.stepIndex] || null;
      if (!step || step.type !== 'reps') return prev;

      const target = Math.max(0, step.targetReps || 0);
      const nextCount = prev.repCount + 1;

      if (settings.autoAdvanceReps && target > 0 && nextCount >= target) {
        const now = Date.now();
        const completed = { ...prev, repCount: nextCount };
        const nextState = makeStepState(completed, steps, prev.stepIndex + 1, 'running', now);
        persistImmediately(prev);
        persistImmediately(nextState);
        return nextState;
      }

      const nextState = { ...prev, repCount: nextCount };
      return nextState;
    });
  }, [persistImmediately, settings.autoAdvanceReps, steps]);

  const decrementRep = useCallback(() => {
    setState((prev) => ({ ...prev, repCount: Math.max(0, prev.repCount - 1) }));
  }, []);

  const goBack = useCallback(() => {
    moveToStepPaused((prev) => prev.stepIndex - 1, 'manualBack');
  }, [moveToStepPaused]);

  const goNext = useCallback(() => {
    moveToStepPaused((prev) => prev.stepIndex + 1, 'manualNext');
  }, [moveToStepPaused]);

  const reset = useCallback(() => {
    stopTick();
    setState(() => {
      persistImmediately(initialState);
      return initialState;
    });
  }, [persistImmediately, stopTick]);

  return {
    state,
    currentStep,
    totalSteps,
    steps,
    remaining: Math.ceil(state.remainingMs / 1000),
    repsCount: state.repCount,
    start,
    pause,
    resume,
    skipRest,
    countRep,
    decrementRep,
    goBack,
    goNext,
    advanceToNextStep,
    reset,
  };
}
