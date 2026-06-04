import { videoFor } from '../exerciseVideos';
import type { DB } from './types';

const day = 24 * 60 * 60 * 1000;
const now = Date.now();

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
        profile: { heightCm: 165, age: 30, sex: 'f', activity: 'light', experience: 'int', daysPerWeek: 4, goalType: 'fatloss' },
      },
      {
        id: 'client-david',
        name: 'David Soler',
        role: 'client',
        email: 'david@email.com',
        trainerId: 'trainer-kike',
        goal: 'Hipertrofia · +5 kg músculo',
        profile: { heightCm: 180, age: 28, sex: 'm', activity: 'mod', experience: 'int', daysPerWeek: 5, goalType: 'muscle' },
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
        meals: [
          {
            id: 'm1',
            name: 'Desayuno',
            time: '08:00',
            items: [
              { id: 'i1', name: 'Avena', grams: 60 },
              { id: 'i2', name: 'Claras de huevo', grams: 200 },
              { id: 'i3', name: 'Arándanos', grams: 80 },
            ],
          },
          {
            id: 'm2',
            name: 'Comida',
            time: '14:00',
            items: [
              { id: 'i4', name: 'Pechuga de pollo', grams: 150 },
              { id: 'i5', name: 'Arroz', grams: 70 },
              { id: 'i6', name: 'Verduras', grams: 200 },
            ],
          },
          {
            id: 'm3',
            name: 'Cena',
            time: '21:00',
            items: [
              { id: 'i7', name: 'Salmón', grams: 130 },
              { id: 'i8', name: 'Boniato', grams: 120 },
            ],
          },
        ],
      },
      {
        id: 'np-david',
        clientId: 'client-david',
        dailyKcal: 2900,
        protein: 200,
        carbs: 330,
        fat: 80,
        updatedAt: now,
        meals: [
          {
            id: 'm4',
            name: 'Desayuno',
            time: '08:30',
            items: [
              { id: 'i9', name: 'Tortilla 4 huevos', grams: 220 },
              { id: 'i10', name: 'Pan integral', grams: 80 },
            ],
          },
        ],
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
