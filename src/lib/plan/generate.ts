import type { Activity, Experience, GoalType, Meal, NutritionDay, NutritionPlan, Sex, WorkoutDay, WorkoutPlan } from '../db/types';
import { WEEKDAYS } from '../db/types';
import { videoFor } from '../exerciseVideos';

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
// Menús rotatorios: cada día de la semana usa una variante distinta de cada
// comida, para que la dieta sea específica por día (no la misma todos los días).
// Las cantidades exactas las ajusta luego Kike.
const BREAKFASTS = [
  (kg: number): Meal => ({ id: uid(), name: 'Desayuno', time: '08:30', items: [
    { id: uid(), name: 'Avena', grams: round(0.7 * kg) }, { id: uid(), name: 'Claras de huevo', grams: 200 }, { id: uid(), name: 'Arándanos', grams: 100 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Desayuno', time: '08:30', items: [
    { id: uid(), name: 'Tostadas integrales', grams: round(0.9 * kg) }, { id: uid(), name: 'Huevos enteros', grams: 150 }, { id: uid(), name: 'Aguacate', grams: 60 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Desayuno', time: '08:30', items: [
    { id: uid(), name: 'Yogur griego', grams: 250 }, { id: uid(), name: 'Granola', grams: round(0.5 * kg) }, { id: uid(), name: 'Plátano', grams: 120 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Desayuno', time: '08:30', items: [
    { id: uid(), name: 'Tortitas de avena', grams: round(0.8 * kg) }, { id: uid(), name: 'Requesón', grams: 150 }, { id: uid(), name: 'Miel', grams: 15 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Desayuno', time: '08:30', items: [
    { id: uid(), name: 'Pan de centeno', grams: round(0.8 * kg) }, { id: uid(), name: 'Pavo', grams: 80 }, { id: uid(), name: 'Tomate', grams: 80 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Desayuno', time: '09:30', items: [
    { id: uid(), name: 'Tortilla 3 huevos', grams: 180 }, { id: uid(), name: 'Pan integral', grams: round(0.7 * kg) }, { id: uid(), name: 'Fruta', grams: 120 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Desayuno', time: '09:30', items: [
    { id: uid(), name: 'Batido proteína', grams: 30 }, { id: uid(), name: 'Avena', grams: round(0.7 * kg) }, { id: uid(), name: 'Crema de cacahuete', grams: 20 } ] }),
];

const LUNCHES = [
  (kg: number): Meal => ({ id: uid(), name: 'Comida', time: '14:00', items: [
    { id: uid(), name: 'Pechuga de pollo', grams: round(2 * kg) }, { id: uid(), name: 'Arroz blanco', grams: round(1.2 * kg) }, { id: uid(), name: 'Verduras salteadas', grams: 200 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Comida', time: '14:00', items: [
    { id: uid(), name: 'Ternera magra', grams: round(1.9 * kg) }, { id: uid(), name: 'Patata cocida', grams: round(1.5 * kg) }, { id: uid(), name: 'Ensalada', grams: 200 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Comida', time: '14:00', items: [
    { id: uid(), name: 'Salmón', grams: round(1.8 * kg) }, { id: uid(), name: 'Quinoa', grams: round(1.1 * kg) }, { id: uid(), name: 'Brócoli', grams: 200 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Comida', time: '14:00', items: [
    { id: uid(), name: 'Pavo a la plancha', grams: round(2 * kg) }, { id: uid(), name: 'Pasta integral', grams: round(1.2 * kg) }, { id: uid(), name: 'Tomate y rúcula', grams: 180 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Comida', time: '14:00', items: [
    { id: uid(), name: 'Merluza', grams: round(2 * kg) }, { id: uid(), name: 'Arroz integral', grams: round(1.2 * kg) }, { id: uid(), name: 'Pimientos', grams: 200 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Comida', time: '14:30', items: [
    { id: uid(), name: 'Lentejas', grams: round(2.2 * kg) }, { id: uid(), name: 'Arroz', grams: round(0.8 * kg) }, { id: uid(), name: 'Verduras', grams: 150 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Comida', time: '14:30', items: [
    { id: uid(), name: 'Pollo al horno', grams: round(2 * kg) }, { id: uid(), name: 'Boniato', grams: round(1.4 * kg) }, { id: uid(), name: 'Espárragos', grams: 180 } ] }),
];

const SNACKS = [
  (): Meal => ({ id: uid(), name: 'Merienda', time: '18:00', items: [ { id: uid(), name: 'Yogur proteico', grams: 200 }, { id: uid(), name: 'Nueces', grams: 25 } ] }),
  (): Meal => ({ id: uid(), name: 'Merienda', time: '18:00', items: [ { id: uid(), name: 'Requesón', grams: 200 }, { id: uid(), name: 'Manzana', grams: 150 } ] }),
  (): Meal => ({ id: uid(), name: 'Merienda', time: '18:00', items: [ { id: uid(), name: 'Batido proteína', grams: 30 }, { id: uid(), name: 'Plátano', grams: 120 } ] }),
  (): Meal => ({ id: uid(), name: 'Merienda', time: '18:00', items: [ { id: uid(), name: 'Tostada integral', grams: 60 }, { id: uid(), name: 'Pavo', grams: 80 } ] }),
  (): Meal => ({ id: uid(), name: 'Merienda', time: '18:00', items: [ { id: uid(), name: 'Yogur griego', grams: 200 }, { id: uid(), name: 'Almendras', grams: 25 } ] }),
  (): Meal => ({ id: uid(), name: 'Merienda', time: '18:30', items: [ { id: uid(), name: 'Fruta variada', grams: 200 }, { id: uid(), name: 'Crema de cacahuete', grams: 20 } ] }),
  (): Meal => ({ id: uid(), name: 'Merienda', time: '18:30', items: [ { id: uid(), name: 'Queso fresco batido', grams: 200 }, { id: uid(), name: 'Frutos rojos', grams: 100 } ] }),
];

const DINNERS = [
  (kg: number): Meal => ({ id: uid(), name: 'Cena', time: '21:30', items: [ { id: uid(), name: 'Salmón', grams: round(1.7 * kg) }, { id: uid(), name: 'Boniato', grams: 120 }, { id: uid(), name: 'Espinacas', grams: 150 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Cena', time: '21:30', items: [ { id: uid(), name: 'Tortilla de claras', grams: 220 }, { id: uid(), name: 'Verduras al horno', grams: round(2 * kg) } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Cena', time: '21:30', items: [ { id: uid(), name: 'Pollo', grams: round(1.7 * kg) }, { id: uid(), name: 'Ensalada completa', grams: 200 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Cena', time: '21:30', items: [ { id: uid(), name: 'Merluza al vapor', grams: round(1.8 * kg) }, { id: uid(), name: 'Calabacín', grams: 200 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Cena', time: '21:30', items: [ { id: uid(), name: 'Atún', grams: round(1.5 * kg) }, { id: uid(), name: 'Ensalada mixta', grams: 200 }, { id: uid(), name: 'Aceite de oliva', grams: 10 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Cena', time: '22:00', items: [ { id: uid(), name: 'Hamburguesa de pavo', grams: round(1.7 * kg) }, { id: uid(), name: 'Pan integral', grams: 60 }, { id: uid(), name: 'Verduras', grams: 120 } ] }),
  (kg: number): Meal => ({ id: uid(), name: 'Cena', time: '21:30', items: [ { id: uid(), name: 'Revuelto de huevos y gambas', grams: 220 }, { id: uid(), name: 'Setas', grams: 150 } ] }),
];

// Construye las 7 dietas (lunes→domingo) variando las comidas cada día.
export function buildNutritionDays(kg: number): NutritionDay[] {
  return WEEKDAYS.map((wd, i) => ({
    id: uid(),
    weekday: wd.key,
    meals: [BREAKFASTS[i](kg), LUNCHES[i](kg), SNACKS[i](), DINNERS[i](kg)],
  }));
}

function buildNutrition(input: PlanInput): { plan: NutritionPlan; tdee: number; bmr: number } {
  const { weightKg: kg, heightCm: cm, age, sex, activity, goalType, clientId } = input;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTOR[activity];
  const kcal = round(tdee * GOAL_FACTOR[goalType], 10);

  const protein = round(goalType === 'maintain' ? 1.8 * kg : 2.0 * kg);
  const fat = round(0.9 * kg);
  const carbs = Math.max(0, round((kcal - protein * 4 - fat * 9) / 4));

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
      days: buildNutritionDays(kg),
      updatedAt: Date.now(),
      status: 'draft',
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
      videoUrl: videoFor(name),
    })),
  }));

  return {
    id: uid(),
    clientId: input.clientId,
    name: `Plan ${GOAL_NAME[input.goalType]} · ${days} días`,
    days: workoutDays,
    updatedAt: Date.now(),
    status: 'draft',
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
