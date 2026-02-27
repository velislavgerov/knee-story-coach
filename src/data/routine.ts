export interface ExerciseDefinition {
  id: string;
  title: string;
  chapter: string;
  narrative: string;
  mode: 'timer' | 'reps' | 'holds';
  sets: number;
  durationSeconds?: number;
  reps?: number;
  holdSeconds?: number;
  relaxSeconds?: number;
  restSeconds: number;
  note?: string;
  tips: string[];
  muscleGroup: 'quads' | 'adductors' | 'general';
}

export interface Step {
  type: 'work' | 'rest' | 'reps' | 'hold' | 'relax';
  exerciseId: string;
  exerciseIndex: number;
  label: string;
  seconds?: number;
  targetReps?: number;
  setIndex: number;
  repIndex?: number;
  totalSets: number;
  note?: string;
}

export const exercises: ExerciseDefinition[] = [
  {
    id: 'bike',
    title: 'Light Stationary Bike',
    chapter: 'Chapter 1',
    narrative: 'We warm the system—steady and easy.',
    mode: 'timer',
    sets: 5,
    durationSeconds: 60,
    restSeconds: 25,
    tips: ['Keep resistance low', 'Smooth pedal strokes', 'Sit upright, core engaged'],
    muscleGroup: 'general',
  },
  {
    id: 'extension',
    title: 'Knee Extension with Band',
    chapter: 'Chapter 2',
    narrative: 'Wake the quad with controlled tension.',
    mode: 'timer',
    sets: 3,
    durationSeconds: 60,
    restSeconds: 20,
    tips: ['Anchor band securely', 'Full extension, slow return', 'Don\'t lock the knee'],
    muscleGroup: 'quads',
  },
  {
    id: 'slr',
    title: 'Straight Leg Raise',
    chapter: 'Chapter 3',
    narrative: 'Strength, without momentum.',
    mode: 'reps',
    sets: 5,
    reps: 20,
    restSeconds: 20,
    tips: ['Keep leg straight', 'Raise to 45°', 'Control the descent'],
    muscleGroup: 'quads',
  },
  {
    id: 'stepups',
    title: 'Step-Ups',
    chapter: 'Chapter 4',
    narrative: 'Build trust in the knee—one step at a time.',
    mode: 'timer',
    sets: 3,
    durationSeconds: 60,
    restSeconds: 20,
    tips: ['Use a stable step', 'Drive through the heel', 'Keep knee aligned with toes'],
    muscleGroup: 'quads',
  },
  {
    id: 'adductors',
    title: 'Inner Thigh — Side-Lying Lift',
    chapter: 'Chapter 5',
    narrative: 'Stability comes from the sides, too.',
    mode: 'reps',
    sets: 3,
    reps: 15,
    restSeconds: 20,
    note: 'Move the knee and ankle with control.',
    tips: ['Lie on your side', 'Use ankle weight if available', 'Slow and controlled motion'],
    muscleGroup: 'adductors',
  },
  {
    id: 'isometric',
    title: 'Static Quad Squeeze',
    chapter: 'Chapter 6',
    narrative: 'Hold. Release. Repeat. Precision over force.',
    mode: 'holds',
    sets: 10,
    holdSeconds: 15,
    relaxSeconds: 10,
    restSeconds: 0,
    tips: ['Press knee down firmly', 'Tighten quad maximally', 'Breathe steadily through hold'],
    muscleGroup: 'quads',
  },
];

export function expandRoutine(bikeRestSeconds: number = 25): Step[] {
  const steps: Step[] = [];

  exercises.forEach((ex, exIdx) => {
    const restSec = ex.id === 'bike' ? bikeRestSeconds : ex.restSeconds;

    if (ex.mode === 'timer') {
      for (let s = 0; s < ex.sets; s++) {
        steps.push({
          type: 'work',
          exerciseId: ex.id,
          exerciseIndex: exIdx,
          label: `${ex.title} — Set ${s + 1}/${ex.sets}`,
          seconds: ex.durationSeconds,
          setIndex: s,
          totalSets: ex.sets,
          note: ex.note,
        });
        if (s < ex.sets - 1) {
          steps.push({
            type: 'rest',
            exerciseId: ex.id,
            exerciseIndex: exIdx,
            label: `Rest`,
            seconds: restSec,
            setIndex: s,
            totalSets: ex.sets,
          });
        }
      }
    } else if (ex.mode === 'reps') {
      for (let s = 0; s < ex.sets; s++) {
        steps.push({
          type: 'reps',
          exerciseId: ex.id,
          exerciseIndex: exIdx,
          label: `${ex.title} — Set ${s + 1}/${ex.sets}`,
          targetReps: ex.reps,
          setIndex: s,
          totalSets: ex.sets,
          note: ex.note,
        });
        if (s < ex.sets - 1) {
          steps.push({
            type: 'rest',
            exerciseId: ex.id,
            exerciseIndex: exIdx,
            label: `Rest`,
            seconds: restSec,
            setIndex: s,
            totalSets: ex.sets,
          });
        }
      }
    } else if (ex.mode === 'holds') {
      for (let s = 0; s < ex.sets; s++) {
        steps.push({
          type: 'hold',
          exerciseId: ex.id,
          exerciseIndex: exIdx,
          label: `${ex.title} — Hold ${s + 1}/${ex.sets}`,
          seconds: ex.holdSeconds,
          setIndex: s,
          repIndex: s,
          totalSets: ex.sets,
          note: ex.note,
        });
        if (s < ex.sets - 1 && ex.relaxSeconds) {
          steps.push({
            type: 'relax',
            exerciseId: ex.id,
            exerciseIndex: exIdx,
            label: `Relax`,
            seconds: ex.relaxSeconds,
            setIndex: s,
            totalSets: ex.sets,
          });
        }
      }
    }
  });

  return steps;
}

export interface SessionLog {
  completedAt: string;
  durationSeconds: number;
  pain?: number;
  notes?: string;
}

export interface UserSettings {
  bikeRestSeconds: number;
  soundOn: boolean;
  reducedMotion: boolean;
  knee: 'left' | 'right';
}

export const defaultSettings: UserSettings = {
  bikeRestSeconds: 25,
  soundOn: false,
  reducedMotion: false,
  knee: 'right',
};
