import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ExerciseCanvas from '@/components/ExerciseCanvas';
import { ExerciseDefinition, exercises } from '@/data/routine';

function describeMode(exercise: ExerciseDefinition): string {
  if (exercise.mode === 'timer') {
    return `${exercise.sets} sets x ${exercise.durationSeconds}s work, ${exercise.restSeconds}s rest`;
  }
  if (exercise.mode === 'reps') {
    return `${exercise.sets} sets x ${exercise.reps} reps, ${exercise.restSeconds}s rest`;
  }
  return `${exercise.sets} hold-relax cycles x ${exercise.holdSeconds}s hold / ${exercise.relaxSeconds}s relax`;
}

export default function DebugAnimations() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const cards = useMemo(() => exercises, []);

  return (
    <div className="min-h-screen noise-overlay bg-gradient-to-b from-background via-background to-secondary/20 px-4 py-5 md:px-6 md:py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-medium text-foreground">Animation Debug Board</h1>
            <p className="text-sm text-muted-foreground/80">All exercise canvases + instructions in one screen.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaused((p) => !p)}
              className="px-3 py-2 rounded-lg bg-secondary/70 text-secondary-foreground text-sm"
            >
              {paused ? 'Resume All' : 'Pause All'}
            </button>
            <button
              onClick={() => setReducedMotion((p) => !p)}
              className="px-3 py-2 rounded-lg bg-secondary/70 text-secondary-foreground text-sm"
            >
              {reducedMotion ? 'Disable Reduced Motion' : 'Enable Reduced Motion'}
            </button>
            <Link to="/" className="px-3 py-2 rounded-lg bg-primary/90 text-primary-foreground text-sm">
              Back to Session
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((exercise) => (
            <article key={exercise.id} className="glass-panel p-4 space-y-3">
              <header>
                <p className="text-xs uppercase tracking-widest text-muted-foreground/70">{exercise.chapter}</p>
                <h2 className="text-lg font-display text-foreground">{exercise.title}</h2>
                <p className="text-xs text-muted-foreground/80 mt-1">{describeMode(exercise)}</p>
              </header>

              <ExerciseCanvas
                exerciseId={exercise.id}
                isActive={!paused}
                reducedMotion={reducedMotion || paused}
              />

              <section className="space-y-2">
                <p className="text-sm text-foreground/75 italic">{exercise.narrative}</p>
                {exercise.note && (
                  <p className="text-sm text-accent">
                    Note: {exercise.note}
                  </p>
                )}
                <ul className="space-y-1">
                  {exercise.tips.map((tip, index) => (
                    <li key={`${exercise.id}-tip-${index}`} className="text-sm text-foreground/70">
                      {index + 1}. {tip}
                    </li>
                  ))}
                </ul>
              </section>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
