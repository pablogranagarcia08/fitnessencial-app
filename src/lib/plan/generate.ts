import type { Activity, Experience, GoalType, MealOption, NutritionDay, NutritionPlan, PlanTask, PlanTaskType, Sex, Weekday, WorkoutDay, WorkoutPlan } from '../db/types';
import { WEEKDAYS } from '../db/types';
import { videoFor } from '../exerciseVideos';
import { foodPhoto } from '../foodPhotos';

const uid = () => Math.random().toString(36).slice(2, 10);
const round = (n: number, step = 1) => Math.round(n / step) * step;

// Duración por defecto de los bloques que genera Kike.
export const PLAN_WEEKS = 12;

export interface PlanInput {
  clientId: string;
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activity: Activity;
  experience: Experience;
  daysPerWeek: number;
  trainingDays?: Weekday[]; // días concretos que quiere entrenar el cliente
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
// Cada comida ofrece VARIAS OPCIONES (plato con foto + receta) entre las que el
// cliente elige. Por día de la semana rotan las opciones para dar variedad.
// Las cantidades exactas las ajusta luego Kike.
type Dish = { name: string; photo: string; items: (kg: number) => { name: string; grams?: number }[] };

const BREAKFAST_DISHES: Dish[] = [
  { name: 'Avena con claras y arándanos', photo: 'oatmeal', items: (kg) => [{ name: 'Avena', grams: round(0.7 * kg) }, { name: 'Claras de huevo', grams: 200 }, { name: 'Arándanos', grams: 100 }] },
  { name: 'Tostadas con huevo y aguacate', photo: 'avocado_toast', items: (kg) => [{ name: 'Pan integral', grams: round(0.9 * kg) }, { name: 'Huevos', grams: 150 }, { name: 'Aguacate', grams: 60 }] },
  { name: 'Yogur griego con granola', photo: 'yogurt_granola', items: (kg) => [{ name: 'Yogur griego', grams: 250 }, { name: 'Granola', grams: round(0.5 * kg) }, { name: 'Plátano', grams: 120 }] },
  { name: 'Tortitas de avena y requesón', photo: 'pancakes', items: (kg) => [{ name: 'Tortitas de avena', grams: round(0.8 * kg) }, { name: 'Requesón', grams: 150 }, { name: 'Miel', grams: 15 }] },
  { name: 'Pan de centeno con pavo', photo: 'rye_turkey', items: (kg) => [{ name: 'Pan de centeno', grams: round(0.8 * kg) }, { name: 'Pavo', grams: 80 }, { name: 'Tomate', grams: 80 }] },
  { name: 'Tortilla con pan y fruta', photo: 'omelette_fruit', items: (kg) => [{ name: 'Tortilla 3 huevos', grams: 180 }, { name: 'Pan integral', grams: round(0.7 * kg) }, { name: 'Fruta', grams: 120 }] },
];

const LUNCH_DISHES: Dish[] = [
  { name: 'Arroz con pollo', photo: 'chicken_rice', items: (kg) => [{ name: 'Pechuga de pollo', grams: round(2 * kg) }, { name: 'Arroz blanco', grams: round(1.2 * kg) }, { name: 'Verduras salteadas', grams: 200 }] },
  { name: 'Ternera con patata', photo: 'beef_potato', items: (kg) => [{ name: 'Ternera magra', grams: round(1.9 * kg) }, { name: 'Patata cocida', grams: round(1.5 * kg) }, { name: 'Ensalada', grams: 200 }] },
  { name: 'Salmón con quinoa', photo: 'salmon_quinoa', items: (kg) => [{ name: 'Salmón', grams: round(1.8 * kg) }, { name: 'Quinoa', grams: round(1.1 * kg) }, { name: 'Brócoli', grams: 200 }] },
  { name: 'Pavo con pasta integral', photo: 'pasta_turkey', items: (kg) => [{ name: 'Pavo a la plancha', grams: round(2 * kg) }, { name: 'Pasta integral', grams: round(1.2 * kg) }, { name: 'Tomate y rúcula', grams: 180 }] },
  { name: 'Merluza con arroz integral', photo: 'hake_rice', items: (kg) => [{ name: 'Merluza', grams: round(2 * kg) }, { name: 'Arroz integral', grams: round(1.2 * kg) }, { name: 'Pimientos', grams: 200 }] },
  { name: 'Lentejas estofadas', photo: 'lentils', items: (kg) => [{ name: 'Lentejas', grams: round(2.2 * kg) }, { name: 'Arroz', grams: round(0.8 * kg) }, { name: 'Verduras', grams: 150 }] },
  { name: 'Pollo al horno con boniato', photo: 'roast_chicken', items: (kg) => [{ name: 'Pollo al horno', grams: round(2 * kg) }, { name: 'Boniato', grams: round(1.4 * kg) }, { name: 'Espárragos', grams: 180 }] },
];

const SNACK_DISHES: Dish[] = [
  { name: 'Yogur proteico con nueces', photo: 'yogurt_nuts', items: () => [{ name: 'Yogur proteico', grams: 200 }, { name: 'Nueces', grams: 25 }] },
  { name: 'Requesón con manzana', photo: 'cottage_apple', items: () => [{ name: 'Requesón', grams: 200 }, { name: 'Manzana', grams: 150 }] },
  { name: 'Batido de proteína y plátano', photo: 'protein_shake', items: () => [{ name: 'Batido proteína', grams: 30 }, { name: 'Plátano', grams: 120 }] },
  { name: 'Tostada de pavo', photo: 'turkey_toast', items: () => [{ name: 'Tostada integral', grams: 60 }, { name: 'Pavo', grams: 80 }] },
  { name: 'Frutos secos y fruta', photo: 'nuts_fruit', items: () => [{ name: 'Frutos secos', grams: 30 }, { name: 'Fruta', grams: 150 }] },
  { name: 'Queso fresco con frutos rojos', photo: 'cheese_berries', items: () => [{ name: 'Queso fresco batido', grams: 200 }, { name: 'Frutos rojos', grams: 100 }] },
];

const DINNER_DISHES: Dish[] = [
  { name: 'Salmón con boniato', photo: 'salmon_sweetpotato', items: (kg) => [{ name: 'Salmón', grams: round(1.7 * kg) }, { name: 'Boniato', grams: 120 }, { name: 'Espinacas', grams: 150 }] },
  { name: 'Tortilla de claras y verduras', photo: 'eggwhite_veg', items: (kg) => [{ name: 'Tortilla de claras', grams: 220 }, { name: 'Verduras al horno', grams: round(2 * kg) }] },
  { name: 'Pollo con ensalada', photo: 'chicken_salad', items: (kg) => [{ name: 'Pollo', grams: round(1.7 * kg) }, { name: 'Ensalada completa', grams: 200 }] },
  { name: 'Merluza al vapor con calabacín', photo: 'steamed_hake', items: (kg) => [{ name: 'Merluza al vapor', grams: round(1.8 * kg) }, { name: 'Calabacín', grams: 200 }] },
  { name: 'Atún con ensalada mixta', photo: 'tuna_salad', items: (kg) => [{ name: 'Atún', grams: round(1.5 * kg) }, { name: 'Ensalada mixta', grams: 200 }, { name: 'Aceite de oliva', grams: 10 }] },
  { name: 'Hamburguesa de pavo', photo: 'turkey_burger', items: (kg) => [{ name: 'Hamburguesa de pavo', grams: round(1.7 * kg) }, { name: 'Pan integral', grams: 60 }, { name: 'Verduras', grams: 120 }] },
];

// Convierte un plato del catálogo en una opción concreta (con foto y receta).
const toOption = (d: Dish, kg: number): MealOption => ({
  id: uid(),
  name: d.name,
  photoUri: foodPhoto(d.photo),
  items: d.items(kg).map((it) => ({ id: uid(), name: it.name, grams: it.grams })),
});

// Toma `count` platos del catálogo empezando en `start` (rota para dar variedad).
const pickOptions = (pool: Dish[], start: number, count: number, kg: number): MealOption[] =>
  Array.from({ length: count }, (_, k) => toOption(pool[(start + k) % pool.length], kg));

// Construye las 7 dietas (lunes→domingo); cada comida con varias opciones a elegir.
export function buildNutritionDays(kg: number): NutritionDay[] {
  return WEEKDAYS.map((wd, i) => ({
    id: uid(),
    weekday: wd.key,
    meals: [
      { id: uid(), name: 'Desayuno', time: '08:30', options: pickOptions(BREAKFAST_DISHES, i, 3, kg) },
      { id: uid(), name: 'Comida', time: '14:00', options: pickOptions(LUNCH_DISHES, i, 4, kg) },
      { id: uid(), name: 'Merienda', time: '18:00', options: pickOptions(SNACK_DISHES, i, 3, kg) },
      { id: uid(), name: 'Cena', time: '21:30', options: pickOptions(DINNER_DISHES, i, 3, kg) },
    ],
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
      weeks: PLAN_WEEKS,
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

// Días de la semana en los que se reparten las sesiones según cuántas haya.
const TRAINING_WEEKDAYS: Record<number, Weekday[]> = {
  2: ['mon', 'thu'],
  3: ['mon', 'wed', 'fri'],
  4: ['mon', 'tue', 'thu', 'fri'],
  5: ['mon', 'tue', 'wed', 'thu', 'fri'],
  6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

// Días concretos elegidos por el cliente (si los hay) o reparto por defecto.
const ORDER: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function resolveWeekdays(input: PlanInput, count: number): Weekday[] {
  const chosen = (input.trainingDays ?? []).slice().sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  if (chosen.length) return chosen.slice(0, count);
  return TRAINING_WEEKDAYS[count] ?? TRAINING_WEEKDAYS[3];
}

function buildWorkout(input: PlanInput): WorkoutPlan {
  const days = Math.min(6, Math.max(2, input.daysPerWeek || 3));
  const split = SPLITS[days] ?? SPLITS[3];
  const sets = setsFor(input.experience);
  const reps = GOAL_REPS[input.goalType];
  // Principiante: menos volumen (4 ejercicios); intermedio/avanzado: más.
  const maxEx = input.experience === 'beg' ? 4 : input.experience === 'int' ? 5 : 6;
  const weekdays = resolveWeekdays(input, days);

  const workoutDays: WorkoutDay[] = split.map((d, i) => ({
    id: uid(),
    name: `${d.label}`,
    weekday: weekdays[i],
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
    name: `Plan ${GOAL_NAME[input.goalType]} · ${days} días · ${PLAN_WEEKS} semanas`,
    days: workoutDays,
    weeks: PLAN_WEEKS,
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
    `Bloque de ${PLAN_WEEKS} semanas calculado para ${input.weightKg} kg · ${input.heightCm} cm · ${input.age} años. ` +
    `Gasto estimado ≈ ${round(tdee, 10)} kcal/día → objetivo ${GOAL_NAME[input.goalType].toLowerCase()}: ` +
    `${nutrition.dailyKcal} kcal (${nutrition.protein}P / ${nutrition.carbs}C / ${nutrition.fat}G). ` +
    `Rutina de ${days} entrenos/semana.`;

  return { nutrition, workout, summary };
}

// Genera la planificación (calendario) del cliente para N semanas a partir del
// plan de entreno: nutrición + caminar a diario, entrenos en sus días, y métricas
// + foto cada lunes. Sustituye lo anterior del cliente.
export function buildScheduleTasks(clientId: string, workout: WorkoutPlan, startTs: number, weeks = PLAN_WEEKS): PlanTask[] {
  const DAY = 24 * 60 * 60 * 1000;
  const start = new Date(startTs);
  start.setHours(0, 0, 0, 0);
  const base = start.getTime();
  const byWeekday = new Map<Weekday, WorkoutDay>();
  workout.days.forEach((d) => d.weekday && byWeekday.set(d.weekday, d));

  const tasks: PlanTask[] = [];
  let n = 0;
  const push = (date: number, type: PlanTaskType, title: string) =>
    tasks.push({ id: `gen-${clientId}-${n++}`, clientId, date, type, title, done: false });

  for (let offset = 0; offset < weeks * 7; offset++) {
    const date = base + offset * DAY;
    const dow = ORDER[(new Date(date).getDay() + 6) % 7];
    push(date, 'nutrition', 'Nutrición');
    push(date, 'cardio', 'Caminar 30 min');
    const session = byWeekday.get(dow);
    if (session) push(date, 'workout', session.name);
    if (dow === 'mon') {
      push(date, 'metric', 'Métricas personales');
      push(date, 'photo', 'Foto de progreso');
    }
  }
  return tasks;
}
