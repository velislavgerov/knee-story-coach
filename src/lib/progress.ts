export interface ProgressSession {
  id: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  pain: number | null;
  notes: string | null;
}

export interface ProgressState {
  programStartDate: string;
  sessions: ProgressSession[];
  lastActiveDate?: string;
}

const STORAGE_KEY = 'knee-rehab-progress';
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export function toLocalYmd(input: Date | string | number = new Date()): string {
  const date = new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseYmd(ymd: string): Date | null {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function createEmptyProgress(): ProgressState {
  return {
    programStartDate: '',
    sessions: [],
  };
}

export function daysBetweenLocalDates(aYmd: string, bYmd: string): number {
  const a = parseYmd(aYmd);
  const b = parseYmd(bYmd);
  if (!a || !b) return 0;
  return Math.floor((b.getTime() - a.getTime()) / MS_IN_DAY);
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      programStartDate: typeof parsed.programStartDate === 'string' ? parsed.programStartDate : '',
      sessions: Array.isArray(parsed.sessions)
        ? parsed.sessions
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => {
              const candidate = entry as Partial<ProgressSession>;
              return {
                id:
                  typeof candidate.id === 'string' && candidate.id
                    ? candidate.id
                    : `legacy-${Math.random().toString(36).slice(2, 10)}`,
                startedAt: typeof candidate.startedAt === 'string' ? candidate.startedAt : new Date().toISOString(),
                completedAt:
                  typeof candidate.completedAt === 'string' ? candidate.completedAt : new Date().toISOString(),
                durationSeconds: Math.max(0, Number(candidate.durationSeconds || 0)),
                pain: typeof candidate.pain === 'number' ? candidate.pain : null,
                notes: typeof candidate.notes === 'string' ? candidate.notes : null,
              };
            })
        : [],
      lastActiveDate: typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : undefined,
    };
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(progress: ProgressState): ProgressState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export function ensureProgramStartDate(progress: ProgressState, dateYmd: string = toLocalYmd()): ProgressState {
  if (progress.programStartDate) return progress;
  const next = {
    ...progress,
    programStartDate: dateYmd,
  };
  return saveProgress(next);
}

export function setProgramStartDate(dateYmd: string): ProgressState {
  const progress = loadProgress();
  const next = {
    ...progress,
    programStartDate: dateYmd,
  };
  return saveProgress(next);
}

export function resetProgress(): ProgressState {
  const empty = createEmptyProgress();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  return empty;
}

export function appendCompletedSession(input: {
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  pain: number | null;
  notes: string | null;
  id?: string;
}): { progress: ProgressState; session: ProgressSession } {
  const progress = ensureProgramStartDate(loadProgress(), toLocalYmd(input.startedAt));
  const id =
    input.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
  const session: ProgressSession = {
    id,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationSeconds: Math.max(0, Math.floor(input.durationSeconds)),
    pain: input.pain,
    notes: input.notes,
  };
  const next: ProgressState = {
    ...progress,
    sessions: [...progress.sessions, session],
    lastActiveDate: toLocalYmd(input.completedAt),
  };
  return { progress: saveProgress(next), session };
}

export function updateProgressSession(
  sessionId: string,
  patch: { pain?: number | null; notes?: string | null },
): ProgressState {
  const progress = loadProgress();
  const next = {
    ...progress,
    sessions: progress.sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            pain: patch.pain !== undefined ? patch.pain : session.pain,
            notes: patch.notes !== undefined ? patch.notes : session.notes,
          }
        : session,
    ),
    lastActiveDate: toLocalYmd(),
  };
  return saveProgress(next);
}

function getDailyTargetForDate(progress: ProgressState, dateYmd: string): number {
  if (!progress.programStartDate) return 1;
  const diff = daysBetweenLocalDates(progress.programStartDate, dateYmd);
  if (diff < 0) return 0;
  const dayIndex = diff + 1;
  return dayIndex <= 2 ? 1 : 2;
}

export function getProgramDayIndex(progress: ProgressState, date: Date = new Date()): number {
  if (!progress.programStartDate) return 1;
  return Math.max(1, daysBetweenLocalDates(progress.programStartDate, toLocalYmd(date)) + 1);
}

export function getDailyTarget(progress: ProgressState, date: Date = new Date()): number {
  return getDailyTargetForDate(progress, toLocalYmd(date));
}

export function getCompletedCountForDate(progress: ProgressState, dateYmd: string): number {
  return progress.sessions.filter((session) => toLocalYmd(session.completedAt) === dateYmd).length;
}

export function getTodayProgress(progress: ProgressState, date: Date = new Date()) {
  const dateYmd = toLocalYmd(date);
  const completedRaw = getCompletedCountForDate(progress, dateYmd);
  const target = getDailyTarget(progress, date);
  const completed = Math.min(completedRaw, target);
  const extraSessions = Math.max(0, completedRaw - target);

  return {
    dateYmd,
    dayIndex: getProgramDayIndex(progress, date),
    completedRaw,
    completed,
    target,
    isTargetMet: completedRaw >= target,
    extraSessions,
  };
}

export function getSevenDaySummary(progress: ProgressState, referenceDate: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  return Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(referenceDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - idx));
    const ymd = toLocalYmd(date);
    const target = getDailyTargetForDate(progress, ymd);
    const completedRaw = getCompletedCountForDate(progress, ymd);
    const completed = target > 0 ? Math.min(completedRaw, target) : 0;
    const status = target === 0 || completedRaw === 0 ? 'empty' : completedRaw >= target ? 'complete' : 'partial';
    return {
      ymd,
      label: formatter.format(date),
      completed,
      completedRaw,
      target,
      status,
    };
  });
}

export function getStreak(progress: ProgressState, today: Date = new Date()): number {
  if (!progress.programStartDate) return 0;
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  while (true) {
    const ymd = toLocalYmd(cursor);
    const target = getDailyTargetForDate(progress, ymd);
    if (target <= 0) break;
    const completed = getCompletedCountForDate(progress, ymd);
    if (completed >= target) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }
  return streak;
}
