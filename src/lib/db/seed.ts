import { videoFor } from '../exerciseVideos';
import { buildNutritionDays } from '../plan/generate';
import type { DB, PlanTask, PlanTaskType } from './types';

const day = 24 * 60 * 60 * 1000;
const now = Date.now();

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const today0 = startOfDay(now);

// Genera la planificación (calendario) de un cliente para ~2 meses alrededor de
// hoy: hábitos diarios (nutrición + caminar), entrenos según su split, y métricas/
// foto semanales. Las tareas pasadas quedan como hechas (adherencia realista).
function makePlanTasks(clientId: string, workoutDays: number[], sessions: string[]): PlanTask[] {
  const tasks: PlanTask[] = [];
  let n = 0;
  const push = (date: number, type: PlanTaskType, title: string, extra?: Partial<PlanTask>) =>
    tasks.push({ id: `pt-${clientId}-${n++}`, clientId, date, type, title, done: date < today0, ...extra });

  for (let offset = -31; offset <= 35; offset++) {
    const date = today0 + offset * day;
    const dow = (new Date(date).getDay() + 6) % 7; // 0 = lunes
    push(date, 'nutrition', 'Nutrición');
    push(date, 'cardio', 'Caminar 30 min');
    const wi = workoutDays.indexOf(dow);
    if (wi !== -1) push(date, 'workout', sessions[wi % sessions.length]);
    if (dow === 0) {
      const week = Math.floor((date - startOfDay(today0 - 60 * day)) / (7 * day));
      if (week % 2 === 0) {
        push(date, 'metric', 'Métricas personales');
        push(date, 'photo', 'Foto de progreso');
      }
    }
  }
  // Un mensaje motivador programado para dentro de unos días, con hora de envío.
  push(today0 + 3 * day, 'message', 'Mensaje programado', {
    time: '09:00',
    body: '¡Vas genial, sigue así! 💪 Esta semana subimos un poco las cargas. Cualquier duda me dices.',
  });
  return tasks;
}

// Datos de ejemplo: 1 entrenador (Kike) + 2 clientes, con planes, chat y progreso.
export function makeSeed(): DB {
  const db: DB = {
    users: [
      {
        id: 'trainer-kike',
        name: 'Kike Grana',
        role: 'trainer',
        email: 'kike@fitnessencial.com',
        goal: 'Entrenador personal · Fitnessencial',
      },
      {
        id: 'client-marta',
        name: 'Marta Ruiz',
        role: 'client',
        email: 'marta@email.com',
        trainerId: 'trainer-kike',
        goal: 'Perder grasa y ganar fuerza',
        status: 'active',
        phone: '+34 612 345 678',
        since: now - 90 * day,
        notes: 'Muy constante. Cuida la técnica en sentadilla. Disponible mañanas.',
        profile: { heightCm: 165, age: 30, sex: 'f', activity: 'light', experience: 'int', daysPerWeek: 4, goalType: 'fatloss' },
      },
      {
        id: 'client-david',
        name: 'David Soler',
        role: 'client',
        email: 'david@email.com',
        trainerId: 'trainer-kike',
        goal: 'Hipertrofia · +5 kg músculo',
        status: 'active',
        phone: '+34 622 111 222',
        since: now - 45 * day,
        profile: { heightCm: 180, age: 28, sex: 'm', activity: 'mod', experience: 'int', daysPerWeek: 5, goalType: 'muscle' },
      },
      {
        id: 'client-laura',
        name: 'Laura Gómez',
        role: 'client',
        email: 'laura@email.com',
        trainerId: 'trainer-kike',
        goal: 'Quiere empezar · primera consulta',
        status: 'lead',
        phone: '+34 633 444 555',
        since: now - 2 * day,
        notes: 'Contactó por Instagram. Pendiente de cerrar plan.',
      },
    ],

    workoutPlans: [
      {
        id: 'wp-marta',
        clientId: 'client-marta',
        name: 'Full Body · Fuerza',
        updatedAt: now,
        days: [
          {
            id: 'wd-m1',
            name: 'Día A · Tren inferior',
            weekday: 'mon',
            exercises: [
              { id: 'e1', name: 'Sentadilla', sets: 4, reps: '6-8', weightKg: 50, done: false },
              { id: 'e2', name: 'Peso muerto rumano', sets: 3, reps: '8-10', weightKg: 40, done: false },
              { id: 'e3', name: 'Prensa', sets: 3, reps: '10-12', weightKg: 80, done: false },
              { id: 'e4', name: 'Elevación de gemelo', sets: 4, reps: '12-15', done: false },
            ],
          },
          {
            id: 'wd-m2',
            name: 'Día B · Tren superior',
            weekday: 'thu',
            exercises: [
              { id: 'e5', name: 'Press banca', sets: 4, reps: '6-8', weightKg: 30, done: false },
              { id: 'e6', name: 'Remo con barra', sets: 4, reps: '8-10', weightKg: 35, done: false },
              { id: 'e7', name: 'Press militar', sets: 3, reps: '8-10', weightKg: 20, done: false },
              { id: 'e8', name: 'Curl bíceps', sets: 3, reps: '10-12', weightKg: 10, done: false },
            ],
          },
        ],
      },
      {
        id: 'wp-david',
        clientId: 'client-david',
        name: 'Push Pull Legs',
        updatedAt: now,
        days: [
          {
            id: 'wd-d1',
            name: 'Push · Pecho/Hombro',
            weekday: 'mon',
            exercises: [
              { id: 'e9', name: 'Press banca', sets: 4, reps: '8-10', weightKg: 70, done: false },
              { id: 'e10', name: 'Press inclinado mancuerna', sets: 3, reps: '10-12', weightKg: 28, done: false },
              { id: 'e11', name: 'Elevaciones laterales', sets: 4, reps: '12-15', weightKg: 10, done: false },
            ],
          },
        ],
      },
    ],

    nutritionPlans: [
      {
        id: 'np-marta',
        clientId: 'client-marta',
        dailyKcal: 1800,
        protein: 140,
        carbs: 160,
        fat: 55,
        updatedAt: now,
        days: buildNutritionDays(66),
      },
      {
        id: 'np-david',
        clientId: 'client-david',
        dailyKcal: 2900,
        protein: 200,
        carbs: 330,
        fat: 80,
        updatedAt: now,
        days: buildNutritionDays(79),
      },
    ],

    messages: [
      { id: 'msg1', fromId: 'trainer-kike', toId: 'client-marta', text: '¡Buenas Marta! ¿Cómo fue el día de piernas?', createdAt: now - 2 * 60 * 60 * 1000 },
      { id: 'msg2', fromId: 'client-marta', toId: 'trainer-kike', text: 'Muy bien, subí 5kg en sentadilla 💪', createdAt: now - 90 * 60 * 1000 },
      { id: 'msg3', fromId: 'trainer-kike', toId: 'client-marta', text: '¡Brutal! Mañana descanso activo, 30 min de caminata.', createdAt: now - 60 * 60 * 1000 },
    ],

    progress: [
      { id: 'p1', clientId: 'client-marta', date: now - 28 * day, weightKg: 68.5, waistCm: 82 },
      { id: 'p2', clientId: 'client-marta', date: now - 21 * day, weightKg: 67.8, waistCm: 81 },
      { id: 'p3', clientId: 'client-marta', date: now - 14 * day, weightKg: 67.0, waistCm: 80 },
      { id: 'p4', clientId: 'client-marta', date: now - 7 * day, weightKg: 66.4, waistCm: 79 },
      { id: 'p5', clientId: 'client-marta', date: now - 1 * day, weightKg: 65.9, waistCm: 78 },
      { id: 'p6', clientId: 'client-david', date: now - 14 * day, weightKg: 78.0 },
      { id: 'p7', clientId: 'client-david', date: now - 1 * day, weightKg: 79.2 },
    ],

    reminders: [
      { id: 'rem1', trainerId: 'trainer-kike', clientId: 'client-laura', text: 'Llamar a Laura para cerrar su plan', due: now, done: false },
      { id: 'rem2', trainerId: 'trainer-kike', clientId: 'client-david', text: 'Revisar progreso de David y subir cargas', due: now + 2 * day, done: false },
      { id: 'rem3', trainerId: 'trainer-kike', text: 'Preparar publicación para Instagram', due: now + 1 * day, done: false },
    ],

    planTasks: [
      ...makePlanTasks('client-marta', [0, 1, 3, 5], ['Glúteos en Acción', 'Torso A · Brazos fuertes', 'Piernas completa + glúteo', 'Fuerza Superior y Full Body']),
      ...makePlanTasks('client-david', [0, 1, 2, 3, 4], ['Push · Pecho/Hombro', 'Pull · Espalda/Bíceps', 'Pierna completa', 'Torso fuerza', 'Full Body']),
    ],
  };

  // Adjunta el vídeo de explicación a cada ejercicio que tenga uno disponible.
  db.workoutPlans.forEach((p) =>
    p.days.forEach((d) =>
      d.exercises.forEach((e) => {
        if (!e.videoUrl) e.videoUrl = videoFor(e.name);
      })
    )
  );

  return db;
}
