"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuid } from "uuid";
import {
  Workout,
  Exercise,
  WorkoutSet,
  CompletedWorkout,
} from "@/lib/types";
import {
  getSavedWorkouts,
  saveWorkout,
  deleteWorkout,
  getHistory,
  addToHistory,
} from "@/lib/store";

// ─── Helpers ───
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function newSet(): WorkoutSet {
  return { id: uuid(), reps: 10, weight: 0 };
}

function newExercise(): Exercise {
  return { id: uuid(), name: "", sets: [newSet()] };
}

// ─── Screen type ───
type Screen =
  | { type: "home" }
  | { type: "builder"; workout: Workout; isNew: boolean }
  | { type: "session"; workout: Workout }
  | { type: "history" }
  | { type: "completed" };

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState<Screen>({ type: "home" });
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [historyList, setHistoryList] = useState<CompletedWorkout[]>([]);

  useEffect(() => {
    setWorkouts(getSavedWorkouts());
    setHistoryList(getHistory());
  }, []);

  const refreshData = () => {
    setWorkouts(getSavedWorkouts());
    setHistoryList(getHistory());
  };

  if (screen.type === "home") {
    return (
      <HomeScreen
        workouts={workouts}
        history={historyList}
        onNewWorkout={() => {
          const w: Workout = {
            id: uuid(),
            name: "",
            exercises: [newExercise()],
            createdAt: new Date().toISOString(),
          };
          setScreen({ type: "builder", workout: w, isNew: true });
        }}
        onEditWorkout={(w) =>
          setScreen({ type: "builder", workout: structuredClone(w), isNew: false })
        }
        onStartWorkout={(w) => setScreen({ type: "session", workout: structuredClone(w) })}
        onDeleteWorkout={(id) => {
          deleteWorkout(id);
          refreshData();
        }}
        onViewHistory={() => setScreen({ type: "history" })}
      />
    );
  }

  if (screen.type === "builder") {
    return (
      <BuilderScreen
        workout={screen.workout}
        isNew={screen.isNew}
        onSave={(w) => {
          saveWorkout(w);
          refreshData();
          setScreen({ type: "home" });
        }}
        onBack={() => setScreen({ type: "home" })}
        onStartWorkout={(w) => {
          saveWorkout(w);
          refreshData();
          setScreen({ type: "session", workout: structuredClone(w) });
        }}
      />
    );
  }

  if (screen.type === "session") {
    return (
      <SessionScreen
        workout={screen.workout}
        onComplete={(entry) => {
          addToHistory(entry);
          refreshData();
          setScreen({ type: "completed" });
        }}
        onQuit={() => setScreen({ type: "home" })}
      />
    );
  }

  if (screen.type === "completed") {
    return <CompletedScreen onHome={() => setScreen({ type: "home" })} />;
  }

  if (screen.type === "history") {
    return (
      <HistoryScreen history={historyList} onBack={() => setScreen({ type: "home" })} />
    );
  }

  return null;
}

// ═══════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════
function HomeScreen({
  workouts,
  history,
  onNewWorkout,
  onEditWorkout,
  onStartWorkout,
  onDeleteWorkout,
  onViewHistory,
}: {
  workouts: Workout[];
  history: CompletedWorkout[];
  onNewWorkout: () => void;
  onEditWorkout: (w: Workout) => void;
  onStartWorkout: (w: Workout) => void;
  onDeleteWorkout: (id: string) => void;
  onViewHistory: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="pt-12 pb-6 px-5 text-center">
        <h1 className="text-2xl font-bold tracking-wider text-accent">
          ADRIAN&apos;S MUSCLE PLAN
        </h1>
        <p className="text-sm text-gray-400 mt-1">Let&apos;s get strong!</p>
      </div>

      <div className="flex-1 px-4 pb-4 space-y-6 max-w-lg mx-auto w-full">
        {/* New Workout */}
        <button
          onClick={onNewWorkout}
          className="w-full py-4 rounded-xl border-2 border-dashed border-accent/50 text-accent font-semibold text-lg hover:bg-accent/10 active:bg-accent/20 transition-colors"
        >
          + BUILD NEW WORKOUT
        </button>

        {/* Saved Workouts */}
        {workouts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Saved Workouts
            </h2>
            <div className="space-y-2">
              {workouts.map((w) => (
                <div
                  key={w.id}
                  className="bg-bg-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{w.name || "Unnamed Workout"}</p>
                    <p className="text-sm text-gray-400">
                      {w.exercises.length} exercise{w.exercises.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => onEditWorkout(w)}
                      className="px-3 py-2 rounded-lg bg-bg-secondary text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onStartWorkout(w)}
                      className="px-3 py-2 rounded-lg bg-accent text-bg-primary text-sm font-bold"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => onDeleteWorkout(w.id)}
                      className="px-2 py-2 rounded-lg text-danger"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Recent History
              </h2>
              <button onClick={onViewHistory} className="text-accent text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {history.slice(0, 3).map((h) => (
                <div key={h.id} className="bg-bg-card rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{h.workoutName}</p>
                    <p className="text-sm text-gray-400">{formatTime(h.totalDurationSeconds)}</p>
                  </div>
                  <p className="text-sm text-gray-400">{formatDate(h.completedAt)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// BUILDER SCREEN
// ═══════════════════════════════════════════════
function BuilderScreen({
  workout: initial,
  isNew,
  onSave,
  onBack,
  onStartWorkout,
}: {
  workout: Workout;
  isNew: boolean;
  onSave: (w: Workout) => void;
  onBack: () => void;
  onStartWorkout: (w: Workout) => void;
}) {
  const [workout, setWorkout] = useState<Workout>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateExercise = (exId: string, updater: (ex: Exercise) => Exercise) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => (ex.id === exId ? updater(ex) : ex)),
    }));
  };

  const addExercise = () => {
    const ex = newExercise();
    setWorkout((prev) => ({ ...prev, exercises: [...prev.exercises, ex] }));
    setExpandedId(ex.id);
  };

  const removeExercise = (exId: string) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== exId),
    }));
    if (expandedId === exId) setExpandedId(null);
  };

  const addSet = (exId: string) => {
    updateExercise(exId, (ex) => {
      const lastSet = ex.sets[ex.sets.length - 1];
      const ns: WorkoutSet = {
        id: uuid(),
        reps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 0,
      };
      return { ...ex, sets: [...ex.sets, ns] };
    });
  };

  const removeSet = (exId: string, setId: string) => {
    updateExercise(exId, (ex) => ({
      ...ex,
      sets: ex.sets.filter((s) => s.id !== setId),
    }));
  };

  const updateSet = (exId: string, setId: string, field: "reps" | "weight", value: number) => {
    updateExercise(exId, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
    }));
  };

  const isValid = workout.name.trim() !== "" && workout.exercises.length > 0 &&
    workout.exercises.every((ex) => ex.name.trim() !== "" && ex.sets.length > 0);

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-4">
        <button onClick={onBack} className="text-gray-400 p-2 -ml-2">
          <ArrowLeftIcon />
        </button>
        <input
          type="text"
          value={workout.name}
          onChange={(e) => setWorkout((p) => ({ ...p, name: e.target.value }))}
          placeholder="Workout Name..."
          className="flex-1 text-center text-xl font-bold bg-transparent outline-none placeholder-gray-500 uppercase tracking-wider"
        />
        <div className="w-8" />
      </div>

      {/* Exercises */}
      <div className="flex-1 overflow-y-auto px-4 pb-40 space-y-3">
        {workout.exercises.map((ex, exIdx) => {
          const isExpanded = expandedId === ex.id;
          return (
            <div key={ex.id} className="bg-bg-card rounded-xl overflow-hidden">
              {/* Collapsed header */}
              <div
                className="flex items-center p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : ex.id)}
              >
                <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-sm font-bold mr-3">
                  {exIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {ex.name || "New Exercise"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {ex.sets.length} Set{ex.sets.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button className="text-gray-400 p-1">
                  <HamburgerIcon />
                </button>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-white/5">
                  {/* Exercise name */}
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) =>
                      updateExercise(ex.id, (prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Exercise Name..."
                    className="w-full mt-3 mb-3 px-3 py-2 rounded-lg bg-bg-input text-white placeholder-gray-500 outline-none text-sm"
                  />

                  {/* Set headers */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 font-semibold uppercase">
                    <div className="w-5 text-center">#</div>
                    <div className="flex-1">Reps</div>
                    <div className="flex-1">Weight (kg)</div>
                    <div className="w-6" />
                  </div>

                  {/* Sets */}
                  {ex.sets.map((s, sIdx) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="w-5 text-sm text-gray-400 text-center shrink-0">{sIdx + 1}</span>
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) =>
                          updateSet(ex.id, s.id, "reps", Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="flex-1 min-w-0 px-2 py-2 rounded-lg bg-bg-input text-white text-center outline-none"
                      />
                      <input
                        type="number"
                        value={s.weight}
                        onChange={(e) =>
                          updateSet(ex.id, s.id, "weight", Math.max(0, parseFloat(e.target.value) || 0))
                        }
                        className="flex-1 min-w-0 px-2 py-2 rounded-lg bg-bg-input text-white text-center outline-none"
                      />
                      <button
                        onClick={() => removeSet(ex.id, s.id)}
                        className="w-6 shrink-0 text-gray-400 hover:text-danger transition-colors flex items-center justify-center"
                      >
                        <XIcon />
                      </button>
                    </div>
                  ))}

                  {/* Add set / delete exercise */}
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => addSet(ex.id)}
                      className="text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      ADD SET <span className="text-lg leading-none">+</span>
                    </button>
                    <button
                      onClick={() => removeExercise(ex.id)}
                      className="text-danger p-1"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add exercise */}
        <button
          onClick={addExercise}
          className="w-full py-4 rounded-xl border-2 border-dashed border-accent/30 text-accent/70 font-semibold flex items-center justify-center gap-2 hover:bg-accent/5 transition-colors"
        >
          <span className="text-2xl leading-none">+</span> ADD EXERCISE
        </button>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur-sm border-t border-white/5 p-4 space-y-2 w-full" style={{maxWidth: "32rem", margin: "0 auto"}}>
        <button
          onClick={() => onSave(workout)}
          disabled={!workout.name.trim()}
          className="w-full py-3 rounded-xl bg-bg-card text-white font-semibold disabled:opacity-30"
        >
          SAVE WORKOUT
        </button>
        <button
          onClick={() => onStartWorkout(workout)}
          disabled={!isValid}
          className="w-full py-4 rounded-xl border-2 border-accent text-accent font-bold text-lg disabled:opacity-30"
        >
          START WORKOUT
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SESSION SCREEN
// ═══════════════════════════════════════════════
function SessionScreen({
  workout,
  onComplete,
  onQuit,
}: {
  workout: Workout;
  onComplete: (entry: CompletedWorkout) => void;
  onQuit: () => void;
}) {
  const [tab, setTab] = useState<"live" | "exercises">("live");
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [setTime, setSetTime] = useState(0);
  const startedAtRef = useRef(new Date().toISOString());
  const lastSoundRef = useRef(-1);

  const playRandomSound = useCallback(() => {
    const total = 6;
    let pick: number;
    do {
      pick = Math.floor(Math.random() * total) + 1;
    } while (pick === lastSoundRef.current && total > 1);
    lastSoundRef.current = pick;
    const audio = new Audio(`/sounds/${pick}.mpeg`);
    audio.play().catch(() => {});
  }, []);

  // Total timer
  useEffect(() => {
    const interval = setInterval(() => setTotalTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Set/rest timer
  useEffect(() => {
    const interval = setInterval(() => setSetTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentExercise = workout.exercises[exerciseIdx];
  const currentSet = currentExercise?.sets[setIdx];
  const totalSets = currentExercise?.sets.length ?? 0;

  const handleEndSet = useCallback(() => {
    setSetTime(0);

    const isLastSet = setIdx >= totalSets - 1;
    const isLastExercise = exerciseIdx >= workout.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      playRandomSound();
      onComplete({
        id: uuid(),
        workoutName: workout.name,
        exercises: workout.exercises,
        startedAt: startedAtRef.current,
        completedAt: new Date().toISOString(),
        totalDurationSeconds: totalTime,
      });
      return;
    }

    if (isResting) {
      // Move to next set or next exercise
      if (isLastSet) {
        setExerciseIdx((i) => i + 1);
        setSetIdx(0);
      } else {
        setSetIdx((i) => i + 1);
      }
      setIsResting(false);
    } else {
      playRandomSound();
      setIsResting(true);
    }
  }, [setIdx, totalSets, exerciseIdx, workout, isResting, onComplete, totalTime, playRandomSound]);

  if (!currentExercise) return null;

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="text-center pt-6 pb-2 px-4">
        <div className="flex items-center justify-between">
          <button onClick={onQuit} className="text-gray-400 p-2">
            <ArrowLeftIcon />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-wider uppercase">
              {workout.name}
            </h1>
            <p className="text-sm text-gray-400">{formatTime(totalTime)}</p>
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mx-4">
        <button
          onClick={() => setTab("live")}
          className={`flex-1 py-3 text-sm font-semibold tracking-wider ${
            tab === "live"
              ? "text-white border-b-2 border-accent"
              : "text-gray-500"
          }`}
        >
          LIVE SESSION
        </button>
        <button
          onClick={() => setTab("exercises")}
          className={`flex-1 py-3 text-sm font-semibold tracking-wider ${
            tab === "exercises"
              ? "text-white border-b-2 border-accent"
              : "text-gray-500"
          }`}
        >
          EXERCISES
        </button>
      </div>

      {tab === "live" ? (
        <div className="flex-1 flex flex-col items-center px-4 pt-6">
          {/* Timer ring */}
          <div className="relative w-56 h-56 mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#2d3344"
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={isResting ? "#9ca3af" : "#00e5a0"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - Math.min(setTime / 120, 1))}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-sm font-bold tracking-widest ${
                  isResting ? "text-rest" : "text-accent"
                }`}
              >
                {isResting ? "REST" : "ACTIVE"}
              </span>
              <span className="text-5xl font-bold tracking-tight mt-1">
                {formatTime(setTime)}
              </span>
            </div>
          </div>

          {/* Current exercise card */}
          <div className="w-full max-w-sm bg-bg-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              {isResting && <span className="text-xs text-accent font-semibold">Next</span>}
              <p className="font-semibold text-lg flex-1">
                {currentExercise.name}
              </p>
            </div>
            <div className="grid grid-cols-3 text-center">
              <div>
                <p className="text-3xl font-bold">
                  {setIdx + 1}/{totalSets}
                </p>
                <p className="text-xs text-gray-400 uppercase mt-1">Set</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{currentSet?.reps ?? 0}</p>
                <p className="text-xs text-gray-400 uppercase mt-1">Reps</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{currentSet?.weight ?? 0}</p>
                <p className="text-xs text-gray-400 uppercase mt-1">KG</p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="w-full max-w-sm px-4 mt-auto pb-8">
            <button
              onClick={handleEndSet}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
                isResting
                  ? "border-2 border-accent text-accent bg-transparent"
                  : "bg-white text-bg-primary"
              }`}
            >
              {isResting ? "START SET" : "END SET"}
            </button>
          </div>
        </div>
      ) : (
        /* Exercises tab */
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {workout.exercises.map((ex, idx) => {
            const isCurrent = idx === exerciseIdx;
            const isDone = idx < exerciseIdx;
            return (
              <div
                key={ex.id}
                className={`rounded-xl p-4 ${
                  isCurrent
                    ? "bg-accent/10 border border-accent/30"
                    : isDone
                    ? "bg-bg-card/50 opacity-50"
                    : "bg-bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isDone
                        ? "bg-accent text-bg-primary"
                        : isCurrent
                        ? "bg-accent/20 text-accent"
                        : "bg-bg-secondary text-gray-400"
                    }`}
                  >
                    {isDone ? "✓" : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{ex.name}</p>
                    <p className="text-sm text-gray-400">
                      {ex.sets.length} set{ex.sets.length !== 1 ? "s" : ""}
                      {isCurrent && ` — Set ${setIdx + 1}/${totalSets}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// COMPLETED SCREEN
// ═══════════════════════════════════════════════
function CompletedScreen({ onHome }: { onHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary px-6 text-center">
      <div className="text-6xl mb-6">&#128170;</div>
      <h1 className="text-3xl font-bold text-accent mb-2">WORKOUT COMPLETED</h1>
      <p className="text-xl text-gray-300 mb-8">WELL DONE, ADRIAN!</p>
      <button
        onClick={onHome}
        className="px-8 py-4 rounded-xl border-2 border-accent text-accent font-bold text-lg"
      >
        BACK TO HOME
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// HISTORY SCREEN
// ═══════════════════════════════════════════════
function HistoryScreen({
  history,
  onBack,
}: {
  history: CompletedWorkout[];
  onBack: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <div className="flex items-center px-4 pt-6 pb-4">
        <button onClick={onBack} className="text-gray-400 p-2 -ml-2">
          <ArrowLeftIcon />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold tracking-wider uppercase">
          Workout History
        </h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 max-w-lg mx-auto w-full">
        {history.length === 0 && (
          <p className="text-center text-gray-500 mt-12">No workouts yet. Go train!</p>
        )}
        {history.map((h) => (
          <div key={h.id} className="bg-bg-card rounded-xl overflow-hidden">
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold">{h.workoutName}</p>
                <p className="text-sm text-accent font-mono">{formatTime(h.totalDurationSeconds)}</p>
              </div>
              <p className="text-sm text-gray-400">{formatDate(h.completedAt)}</p>
              <p className="text-sm text-gray-500">
                {h.exercises.length} exercise{h.exercises.length !== 1 ? "s" : ""}
              </p>
            </div>
            {expandedId === h.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                {h.exercises.map((ex, i) => (
                  <div key={i}>
                    <p className="font-medium text-sm text-accent">{ex.name}</p>
                    {ex.sets.map((s, si) => (
                      <p key={si} className="text-sm text-gray-400 ml-3">
                        Set {si + 1}: {s.reps} reps × {s.weight} kg
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════
function ArrowLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
