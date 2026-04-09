export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
}

export interface CompletedWorkout {
  id: string;
  workoutName: string;
  exercises: Exercise[];
  startedAt: string;
  completedAt: string;
  totalDurationSeconds: number;
}
