import { Workout, CompletedWorkout } from "./types";

const WORKOUTS_KEY = "adrian_workouts";
const HISTORY_KEY = "adrian_history";

export function getSavedWorkouts(): Workout[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(WORKOUTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveWorkout(workout: Workout): void {
  const workouts = getSavedWorkouts();
  const idx = workouts.findIndex((w) => w.id === workout.id);
  if (idx >= 0) {
    workouts[idx] = workout;
  } else {
    workouts.push(workout);
  }
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export function deleteWorkout(id: string): void {
  const workouts = getSavedWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export function getHistory(): CompletedWorkout[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export function addToHistory(entry: CompletedWorkout): void {
  const history = getHistory();
  history.unshift(entry);
  // Keep only last 20
  if (history.length > 20) history.length = 20;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
