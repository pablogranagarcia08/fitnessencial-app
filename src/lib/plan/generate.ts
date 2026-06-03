import type { Activity, Experience, GoalType, Meal, NutritionPlan, Sex, WorkoutDay, WorkoutPlan } from '../db/types';

const uid = () => Math.random().toString(36).slice(2, 10);
const round = (n: number, step = 1) => Math.round(n / step) * step;

export interface PlanInput {
  clientId: string;
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activity: Activity;
  experience: Experience;
  daysPerWeek: number;
  goalType: GoalType;
}

export interface GeneratedPlan {
  nutrition: NutritionPlan;
  workout: WorkoutPlan;
  summary: string;
}

const ACTIVITY_FACTOR: Record<Activity, number> = { sed: 1.2, light: 1.375, mod: 1.55, high: 1.725 };
const GOAL_NAME: Record<GoalType, string> = { fatloss: 'Definición', muscle: 'Hipertrofia', maintain: 'Mantenimiento' };
const GOAL_FACTOR: Record<GoalType, number> = { fatloss: 0.8, muscle: 1.1, maintain: 1.0 };
const GOAL_REPS: Record<GoalType, string> = { fatloss: '12-15', muscle: '8-12', maintain: '10-12' };

// ---------- Nutrición (Mifflin-St Jeor) ----------
function buildNutrition(input: PlanInput): { plan: NutritionPlan; tdee: number; bmr: number } {
  const { weightKg: kg, heightCm: cm, age, sex, activity, goalType, clientId } = input;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTOR[activity];
  const kcal = round(tdee * GOAL_FACTOR[goalType], 10);

  const protein = round(goalType === 'maintain' ? 1.8 * kg : 2.0 * kg);
  const fat = round(0.9 * kg);
  const carbs = Math.max(0, round((kcal - protein * 4 - fat * 9) / 4));

  // Reparto orientativo de comidas (las cantidades exactas las ajusta Kike).
  const meals: Meal[] = [
    { id: uid(), name: 'Desayuno', time: '08:30', items: [
      { id: uid(), name: 'Avena', grams: round(0.7 * kg) },
      { id: uid(), name: 'Claras de huevo', grams: 200 },
      { id: uid(), name: 'Fruta', grams: 100 },
    ] },
    { id: uid(), name: 'Comida', time: '14:00', items: [
      { id: uid(), name: 'Pollo / pavo', grams: round(2 * kg) },
      { id: uid(), name: 'Arroz / patata', grams: round(1.2 * kg) },
      { id: uid(), name: 'Verduras', grams: 200 },
    ] },
    { id: uid(), name: 'Merienda', time: '18:00', items: [
      { id: uid(), name: 'Yogur proteico', grams: 200 },
      { id: uid(), name: 'Frutos secos', grams: 25 },
    ] },
    { id: uid(), name: 'Cena', time: '21:30', items: [
      { id: uid(), name: 'Pescado / huevos', grams: round(1.8 * kg) },
      { id: uid(), name: 'Boniato / verduras', grams: 150 },
    ] },
  ];

  return {
    bmr,
    tdee,
    plan: {
      id: uid(),
      clientId,
      dailyKcal: kcal,
      protein,
      carbs,
      fat,
      meals,
      updatedAt: Date.now(),
    },
  };
}

// ---------- Entrenamiento ----------
const POOL: Record<string, string[]> = {
  push: ['Press banca', 'Press inclinado mancuerna', 'Press militar', 'Elevaciones laterales', 'Extensión de tríceps'],
  pull: ['Dominadas / Jalón al pecho', 'Remo con barra', 'Remo mancuerna', 'Face pull', 'Curl de bíceps'],
  legs: ['Sentadilla', 'Peso muerto rumano', 'Prensa', 'Curl femoral', 'Elevación de gemelo'],
  upper: ['Press banca', 'Remo con barra', 'Press militar', 'Jalón al pecho', 'Curl de bíceps', 'Extensión de tríceps'],
  lower: ['Sentadilla', 'Peso muerto rumano', 'Prensa', 'Zancadas', 'Elevación de gemelo'],
  full: ['Sentadilla', 'Press banca', 'Remo con barra', 'Press militar', 'Peso muerto rumano', 'Plancha'],
};

const SPLITS: Record<number, { label: string; key: keyof typeof POOL }[]> = {
  2: [{ label: 'Full Body A', key: 'full' }, { label: 'Full Body B', key: 'full' }],
  3: [{ label: 'Empuje', key: 'push' }, { label: 'Tirón', key: 'pull' }, { label: 'Pierna', key: 'legs' }],
  4: [{ label: 'Torso A', key: 'upper' }, { label: 'Pierna A', key: 'lower' }, { label: 'Torso B', key: 'upper' }, { label: 'Pierna B', key: 'lower' }],
  5: [{ label: 'Empuje', key: 'push' }, { label: 'Tirón', key: 'pull' }, { label: 'Pierna', key: 'legs' }, { label: 'Torso', key: 'upper' }, { label: 'Pierna II', key: 'lower' }],
  6: [{ label: 'Empuje A', key: 'push' }, { label: 'Tirón A', key: 'pull' }, { label: 'Pierna A', key: 'legs' }, { label: 'Empuje B', key: 'push' }, { label: 'Tirón B', key: 'pull' }, { label: 'Pierna B', key: 'legs' }],
};

function setsFor(exp: Experience): number {
  return exp === 'adv' ? 4 : 3;
}

function buildWorkout(input: PlanInput): WorkoutPlan {
  const days = Math.min(6, Math.max(2, input.daysPerWeek || 3));
  const split = SPLITS[days] ?? SPLITS[3];
  const sets = setsFor(input.experience);
  const reps = GOAL_REPS[input.goalType];
  // Principiante: menos volumen (4 ejercicios); intermedio/avanzado: más.
  const maxEx = input.experience === 'beg' ? 4 : input.experience === 'int' ? 5 : 6;

  const workoutDays: WorkoutDay[] = split.map((d) => ({
    id: uid(),
    name: `${d.label}`,
    exercises: POOL[d.key].slice(0, maxEx).map((name) => ({
      id: uid(),
      name,
      sets,
      reps,
      done: false,
    })),
  }));

  return {
    id: uid(),
    clientId: input.clientId,
    name: `Plan ${GOAL_NAME[input.goalType]} · ${days} días`,
    days: workoutDays,
    updatedAt: Date.now(),
  };
}

// ---------- API pública del motor (versión local por fórmulas) ----------
export function generatePlanLocal(input: PlanInput): GeneratedPlan {
  const { plan: nutrition, tdee } = buildNutrition(input);
  const workout = buildWorkout(input);
  const days = Math.min(6, Math.max(2, input.daysPerWeek || 3));
  const summary =
    `Calculado para ${input.weightKg} kg · ${input.heightCm} cm · ${input.age} años. ` +
    `Gasto estimado ≈ ${round(tdee, 10)} kcal/día → objetivo ${GOAL_NAME[input.goalType].toLowerCase()}: ` +
    `${nutrition.dailyKcal} kcal (${nutrition.protein}P / ${nutrition.carbs}C / ${nutrition.fat}G). ` +
    `Rutina de ${days} entrenos/semana.`;

  return { nutrition, workout, summary };
}
