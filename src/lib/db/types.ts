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

// Estado del cliente en el CRM del entrenador.
export type ClientStatus = 'active' | 'paused' | 'lead';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatarUri?: string;
  trainerId?: string; // solo clientes
  goal?: string; // objetivo del cliente (texto libre)
  profile?: ClientProfile;
  // --- Campos CRM (cliente) ---
  status?: ClientStatus; // active por defecto
  notes?: string; // notas privadas del entrenador
  phone?: string;
  since?: number; // cliente desde (timestamp)
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
  videoUrl?: string; // enlace YouTube con la explicación del ejercicio (Kike)
  done: boolean; // (compat) — el estado real se deriva de logs
  logs?: SetLog[]; // lo que el cliente registró por serie
}

export interface WorkoutDay {
  id: string;
  name: string; // "Día A · Empuje"
  exercises: Exercise[];
}

// 'draft' = borrador pendiente de que el entrenador lo revise y envíe.
// 'active' (o sin estado) = ya enviado al cliente, visible para él.
export type PlanStatus = 'draft' | 'active';

export interface WorkoutPlan {
  id: string;
  clientId: string;
  name: string;
  days: WorkoutDay[];
  updatedAt: number;
  status?: PlanStatus;
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

// Día de la semana al que se asocia una dieta concreta.
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// Orden y etiquetas de los días (para selectores de UI y generación).
export const WEEKDAYS: { key: Weekday; label: string; short: string }[] = [
  { key: 'mon', label: 'Lunes', short: 'L' },
  { key: 'tue', label: 'Martes', short: 'M' },
  { key: 'wed', label: 'Miércoles', short: 'X' },
  { key: 'thu', label: 'Jueves', short: 'J' },
  { key: 'fri', label: 'Viernes', short: 'V' },
  { key: 'sat', label: 'Sábado', short: 'S' },
  { key: 'sun', label: 'Domingo', short: 'D' },
];

// Dieta específica de un día de la semana (sus comidas).
export interface NutritionDay {
  id: string;
  weekday: Weekday;
  meals: Meal[];
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  dailyKcal: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  days: NutritionDay[]; // dieta específica por cada día de la semana
  updatedAt: number;
  status?: PlanStatus;
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

// Recordatorio/tarea del entrenador (CRM).
export interface Reminder {
  id: string;
  trainerId: string;
  clientId?: string; // opcional: recordatorio ligado a un cliente
  text: string;
  due: number; // timestamp del vencimiento
  done: boolean;
}

// Tipo de tarea de la planificación (calendario tipo Harbiz).
export type PlanTaskType = 'nutrition' | 'workout' | 'cardio' | 'message' | 'metric' | 'photo' | 'note';

// Tarea programada en el calendario de un cliente (día concreto).
export interface PlanTask {
  id: string;
  clientId: string;
  date: number; // timestamp del día programado
  type: PlanTaskType;
  title: string;
  done: boolean;
}

export interface DB {
  users: User[];
  workoutPlans: WorkoutPlan[];
  nutritionPlans: NutritionPlan[];
  messages: Message[];
  progress: ProgressEntry[];
  reminders: Reminder[];
  planTasks: PlanTask[];
}
