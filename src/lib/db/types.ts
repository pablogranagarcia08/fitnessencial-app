// Modelo de datos — espeja el futuro esquema Supabase.
export type Role = 'trainer' | 'client';

export type Sex = 'm' | 'f';
export type Activity = 'sed' | 'light' | 'mod' | 'high';
export type Experience = 'beg' | 'int' | 'adv';
export type GoalType = 'fatloss' | 'muscle' | 'maintain';

// Perfil del cliente: datos que alimentan la generación automática de planes.
export interface ClientProfile {
  heightCm?: number;
  age?: number;
  sex?: Sex;
  activity?: Activity;
  experience?: Experience;
  daysPerWeek?: number;
  goalType?: GoalType;
  generatedAt?: number; // cuándo se generó el último plan automático
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatarUri?: string;
  trainerId?: string; // solo clientes
  goal?: string; // objetivo del cliente (texto libre)
  profile?: ClientProfile;
}

// Registro real de una serie hecha por el cliente.
export interface SetLog {
  weightKg?: number; // kg que usó de verdad
  reps?: string; // reps que hizo de verdad
  done: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number; // nº de series prescritas
  reps: string; // reps objetivo "8-12"
  weightKg?: number; // kg objetivo (orientativo)
  note?: string;
  done: boolean; // (compat) — el estado real se deriva de logs
  logs?: SetLog[]; // lo que el cliente registró por serie
}

export interface WorkoutDay {
  id: string;
  name: string; // "Día A · Empuje"
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  clientId: string;
  name: string;
  days: WorkoutDay[];
  updatedAt: number;
}

export interface MealItem {
  id: string;
  name: string;
  grams?: number;
}

export interface Meal {
  id: string;
  name: string; // "Desayuno"
  time: string; // "08:00"
  items: MealItem[];
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  dailyKcal: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  meals: Meal[];
  updatedAt: number;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: number;
}

export interface ProgressEntry {
  id: string;
  clientId: string;
  date: number; // timestamp
  weightKg: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  photoUri?: string;
  note?: string;
}

export interface DB {
  users: User[];
  workoutPlans: WorkoutPlan[];
  nutritionPlans: NutritionPlan[];
  messages: Message[];
  progress: ProgressEntry[];
}
