import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { planEngine, type PlanInput } from '../plan/engine';
import { buildScheduleTasks } from '../plan/generate';
import { makeSeed } from './seed';
import type { ClientProfile, ClientStatus, DB, Exercise, ExerciseOverride, Meal, MealOption, NutritionDay, NutritionPlan, NutritionTemplate, PlanTask, PlanTaskType, ProgressEntry, RoutineTemplate, SetLog, User, Weekday, WorkoutDay, WorkoutPlan } from './types';
import { WEEKDAYS } from './types';

// Adherencia: % de series marcadas como hechas sobre las prescritas en el plan.
export function planAdherence(plan?: WorkoutPlan | null): { pct: number; done: number; total: number } | null {
  if (!plan) return null;
  let total = 0;
  let done = 0;
  plan.days.forEach((d) =>
    d.exercises.forEach((e) => {
      total += e.sets;
      for (let i = 0; i < e.sets; i++) if (e.logs?.[i]?.done) done++;
    })
  );
  return total ? { pct: Math.round((done / total) * 100), done, total } : null;
}

// Crea/normaliza el array de series de un ejercicio al nº de series prescrito,
// usando el objetivo (kg/reps) como valor por defecto.
const ensureLogs = (e: Exercise): SetLog[] =>
  Array.from({ length: e.sets }, (_, i) => e.logs?.[i] ?? { weightKg: e.weightKg, reps: e.reps, done: false });

const uid = () => Math.random().toString(36).slice(2, 10);

interface State {
  db: DB;
  sessionUserId: string | null;

  // sesión
  loginAs: (userId: string) => void;
  logout: () => void;
  resetDemo: () => void;

  // entrenamiento
  toggleExercise: (planId: string, dayId: string, exId: string) => void;
  logSet: (planId: string, dayId: string, exId: string, index: number, patch: Partial<SetLog>) => void;
  updateExercise: (planId: string, dayId: string, exId: string, patch: Partial<Exercise>) => void;
  addExercise: (planId: string, dayId: string) => void;
  removeExercise: (planId: string, dayId: string, exId: string) => void;
  addWorkoutDayFor: (planId: string, weekday: Weekday) => void; // crea sesión en un día de la semana
  updateWorkoutDay: (planId: string, dayId: string, patch: Partial<Pick<WorkoutDay, 'name'>>) => void;
  removeWorkoutDay: (planId: string, dayId: string) => void;
  setWeekOverride: (planId: string, week: number, exId: string, patch: ExerciseOverride) => void; // progresión por semana
  resetDayProgress: (planId: string, dayId: string) => void;

  // biblioteca de rutinas reutilizables (entrenador)
  saveRoutine: (data: { name: string; exercises: Exercise[] }) => void; // sesión suelta
  saveFullRoutine: (data: { name: string; days: WorkoutDay[] }) => void; // plan completo (semana)
  removeRoutine: (id: string) => void;
  applyRoutine: (planId: string, dayId: string, routineId: string) => void; // carga en una sesión existente
  addRoutineAsDay: (planId: string, weekday: Weekday, routineId: string) => void; // crea sesión desde plantilla
  applyFullRoutine: (planId: string, routineId: string) => void; // reemplaza todo el plan con una plantilla
  createWorkoutFromRoutine: (clientId: string, routineId: string) => void; // crea el plan desde una plantilla (sin plan previo)

  // biblioteca de planes de nutrición reutilizables (entrenador)
  saveNutritionTemplate: (data: { name: string; dailyKcal: number; protein: number; carbs: number; fat: number; days: NutritionDay[] }) => void;
  removeNutritionTemplate: (id: string) => void;
  applyNutritionTemplate: (planId: string, templateId: string) => void; // reemplaza el plan actual
  createNutritionFromTemplate: (clientId: string, templateId: string) => void; // crea el plan desde plantilla

  // nutrición (dieta por día de la semana; cada comida tiene varias opciones)
  updateNutrition: (planId: string, patch: Partial<NutritionPlan>) => void;
  addMeal: (planId: string, dayId: string) => void;
  removeMeal: (planId: string, dayId: string, mealId: string) => void;
  addMealOption: (planId: string, dayId: string, mealId: string) => void;
  removeMealOption: (planId: string, dayId: string, mealId: string, optionId: string) => void;
  addMealItem: (planId: string, dayId: string, mealId: string, optionId: string, name: string, grams?: number) => void;
  removeMealItem: (planId: string, dayId: string, mealId: string, optionId: string, itemId: string) => void;
  copyDayToAll: (planId: string, dayId: string) => void; // copia la dieta de un día al resto

  // chat
  sendMessage: (fromId: string, toId: string, text: string) => void;

  // progreso
  addProgress: (entry: Omit<ProgressEntry, 'id'>) => void;
  removeProgress: (id: string) => void;

  // planificación (calendario)
  togglePlanTask: (id: string) => void;
  addPlanTask: (task: { clientId: string; date: number; type: PlanTaskType; title: string; time?: string; body?: string }) => void;
  updatePlanTask: (id: string, patch: Partial<Pick<PlanTask, 'type' | 'title' | 'time' | 'body'>>) => void;
  removePlanTask: (id: string) => void;

  // CRM + perfil
  updateUser: (userId: string, patch: Partial<User>) => void;
  addClient: (data: { name: string; email: string; phone?: string; goal?: string; status?: ClientStatus }) => string;
  addReminder: (data: { text: string; clientId?: string; due: number }) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  setProfile: (userId: string, patch: Partial<ClientProfile>) => void;
  generatePlanFor: (clientId: string) => Promise<{ summary: string }>;
  publishPlan: (clientId: string) => void; // enviar borrador al cliente (lo activa)
  createWorkoutPlan: (clientId: string) => void; // crear plan de entreno vacío (borrador)
  createNutritionPlan: (clientId: string) => void; // crear plan de nutrición vacío (borrador)
}

const set2 = <T,>(arr: T[], pred: (x: T) => boolean, fn: (x: T) => T): T[] =>
  arr.map((x) => (pred(x) ? fn(x) : x));

// Clona ejercicios para reutilizarlos (ids nuevos, sin progreso del cliente).
const cloneExercises = (exercises: Exercise[]): Exercise[] =>
  exercises.map((e) => ({ id: uid(), name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weightKg, note: e.note, videoUrl: e.videoUrl, done: false }));

// Clona los días de un plan completo (ids nuevos, conserva día de la semana).
const cloneDays = (days: WorkoutDay[]): WorkoutDay[] =>
  days.map((d) => ({ id: uid(), name: d.name, weekday: d.weekday, exercises: cloneExercises(d.exercises) }));

// Clona los días de una dieta (ids nuevos en días, comidas, opciones e ingredientes).
const cloneNutritionDays = (days: NutritionDay[]): NutritionDay[] =>
  days.map((d) => ({
    id: uid(),
    weekday: d.weekday,
    meals: d.meals.map((m) => ({
      id: uid(),
      name: m.name,
      time: m.time,
      options: m.options.map((o) => ({ id: uid(), name: o.name, photoUri: o.photoUri, items: o.items.map((it) => ({ id: uid(), name: it.name, grams: it.grams })) })),
    })),
  }));

// 7 días vacíos (lunes→domingo) para un plan de nutrición nuevo.
const emptyNutritionDays = (): NutritionDay[] =>
  WEEKDAYS.map((wd) => ({ id: uid(), weekday: wd.key, meals: [] }));

// Aplica `fn` a las comidas de un día concreto (plan→día) y marca el plan actualizado.
const mapMeals = (db: DB, planId: string, dayId: string, fn: (meals: Meal[]) => Meal[]): DB => ({
  ...db,
  nutritionPlans: set2(db.nutritionPlans, (p) => p.id === planId, (p) => ({
    ...p,
    updatedAt: Date.now(),
    days: set2(p.days, (d) => d.id === dayId, (d) => ({ ...d, meals: fn(d.meals) })),
  })),
});

export const useStore = create<State>()(
  persist(
    (set) => ({
      db: makeSeed(),
      sessionUserId: null,

      loginAs: (userId) => set({ sessionUserId: userId }),
      logout: () => set({ sessionUserId: null }),
      resetDemo: () => set({ db: makeSeed(), sessionUserId: null }),

      toggleExercise: (planId, dayId, exId) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                exercises: set2(d.exercises, (e) => e.id === exId, (e) => ({ ...e, done: !e.done })),
              })),
            })),
          },
        })),

      logSet: (planId, dayId, exId, index, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                exercises: set2(d.exercises, (e) => e.id === exId, (e) => {
                  const logs = ensureLogs(e);
                  logs[index] = { ...logs[index], ...patch };
                  return { ...e, logs };
                }),
              })),
            })),
          },
        })),

      updateExercise: (planId, dayId, exId, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                exercises: set2(d.exercises, (e) => e.id === exId, (e) => ({ ...e, ...patch })),
              })),
            })),
          },
        })),

      addExercise: (planId, dayId) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                exercises: [
                  ...d.exercises,
                  { id: uid(), name: 'Nuevo ejercicio', sets: 3, reps: '10', done: false } as Exercise,
                ],
              })),
            })),
          },
        })),

      removeExercise: (planId, dayId, exId) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                exercises: d.exercises.filter((e) => e.id !== exId),
              })),
            })),
          },
        })),

      addWorkoutDayFor: (planId, weekday) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: [...p.days, { id: uid(), name: 'Sesión', weekday, exercises: [] } as WorkoutDay],
            })),
          },
        })),

      updateWorkoutDay: (planId, dayId, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: set2(p.days, (d) => d.id === dayId, (d) => ({ ...d, ...patch })),
            })),
          },
        })),

      removeWorkoutDay: (planId, dayId) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: p.days.filter((d) => d.id !== dayId),
            })),
          },
        })),

      setWeekOverride: (planId, week, exId, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => {
              const all = { ...(p.weekOverrides ?? {}) };
              const wk = { ...(all[week] ?? {}) };
              wk[exId] = { ...wk[exId], ...patch };
              all[week] = wk;
              return { ...p, updatedAt: Date.now(), weekOverrides: all };
            }),
          },
        })),

      resetDayProgress: (planId, dayId) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                // reinicia las marcas de hecho (mantiene los kg/reps como referencia)
                exercises: d.exercises.map((e) => ({
                  ...e,
                  done: false,
                  logs: e.logs?.map((l) => ({ ...l, done: false })),
                })),
              })),
            })),
          },
        })),

      saveRoutine: ({ name, exercises }) =>
        set((s) => ({
          db: {
            ...s.db,
            routines: [
              ...(s.db.routines ?? []),
              { id: uid(), trainerId: s.sessionUserId ?? 'trainer-kike', name: name.trim() || 'Rutina', exercises: cloneExercises(exercises) },
            ],
          },
        })),

      saveFullRoutine: ({ name, days }) =>
        set((s) => ({
          db: {
            ...s.db,
            routines: [
              ...(s.db.routines ?? []),
              { id: uid(), trainerId: s.sessionUserId ?? 'trainer-kike', name: name.trim() || 'Plan completo', days: cloneDays(days) },
            ],
          },
        })),

      removeRoutine: (id) =>
        set((s) => ({ db: { ...s.db, routines: (s.db.routines ?? []).filter((r) => r.id !== id) } })),

      applyFullRoutine: (planId, routineId) =>
        set((s) => {
          const routine = (s.db.routines ?? []).find((r) => r.id === routineId);
          if (!routine?.days) return { db: s.db };
          return {
            db: {
              ...s.db,
              workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
                ...p,
                updatedAt: Date.now(),
                days: cloneDays(routine.days!),
              })),
            },
          };
        }),

      createWorkoutFromRoutine: (clientId, routineId) =>
        set((s) => {
          const r = (s.db.routines ?? []).find((x) => x.id === routineId);
          if (!r) return { db: s.db };
          // Plan completo → todos sus días; sesión suelta → un único día (lunes).
          const days = r.days ? cloneDays(r.days) : [{ id: uid(), name: r.name, weekday: 'mon' as Weekday, exercises: cloneExercises(r.exercises ?? []) }];
          const plan: WorkoutPlan = { id: uid(), clientId, name: r.name, status: 'draft', weeks: 12, updatedAt: Date.now(), days };
          // Programa la rutina en el calendario para las 12 semanas.
          const schedule = buildScheduleTasks(clientId, plan, Date.now());
          return {
            db: {
              ...s.db,
              workoutPlans: [...s.db.workoutPlans.filter((p) => p.clientId !== clientId), plan],
              planTasks: [...(s.db.planTasks ?? []).filter((t) => t.clientId !== clientId), ...schedule],
            },
          };
        }),

      applyRoutine: (planId, dayId, routineId) =>
        set((s) => {
          const routine = (s.db.routines ?? []).find((r) => r.id === routineId);
          const ex = routine?.exercises ?? routine?.days?.flatMap((d) => d.exercises);
          if (!ex) return { db: s.db };
          return {
            db: {
              ...s.db,
              workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
                ...p,
                updatedAt: Date.now(),
                days: set2(p.days, (d) => d.id === dayId, (d) => ({ ...d, exercises: cloneExercises(ex) })),
              })),
            },
          };
        }),

      addRoutineAsDay: (planId, weekday, routineId) =>
        set((s) => {
          const routine = (s.db.routines ?? []).find((r) => r.id === routineId);
          const ex = routine?.exercises ?? routine?.days?.flatMap((d) => d.exercises);
          if (!routine || !ex) return { db: s.db };
          return {
            db: {
              ...s.db,
              workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
                ...p,
                updatedAt: Date.now(),
                days: [...p.days, { id: uid(), name: routine.name, weekday, exercises: cloneExercises(ex) }],
              })),
            },
          };
        }),

      updateNutrition: (planId, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              ...patch,
              updatedAt: Date.now(),
            })),
          },
        })),

      // Helper interno: mapea una comida concreta dentro de plan→día.
      addMeal: (planId, dayId) =>
        set((s) => ({
          db: mapMeals(s.db, planId, dayId, (meals) => [
            ...meals,
            { id: uid(), name: 'Nueva comida', time: '12:00', options: [{ id: uid(), name: 'Opción 1', items: [] }] } as Meal,
          ]),
        })),

      removeMeal: (planId, dayId, mealId) =>
        set((s) => ({
          db: mapMeals(s.db, planId, dayId, (meals) => meals.filter((m) => m.id !== mealId)),
        })),

      addMealOption: (planId, dayId, mealId) =>
        set((s) => ({
          db: mapMeals(s.db, planId, dayId, (meals) =>
            set2(meals, (m) => m.id === mealId, (m) => ({
              ...m,
              options: [...m.options, { id: uid(), name: `Opción ${m.options.length + 1}`, items: [] } as MealOption],
            }))
          ),
        })),

      removeMealOption: (planId, dayId, mealId, optionId) =>
        set((s) => ({
          db: mapMeals(s.db, planId, dayId, (meals) =>
            set2(meals, (m) => m.id === mealId, (m) => ({ ...m, options: m.options.filter((o) => o.id !== optionId) }))
          ),
        })),

      addMealItem: (planId, dayId, mealId, optionId, name, grams) =>
        set((s) => ({
          db: mapMeals(s.db, planId, dayId, (meals) =>
            set2(meals, (m) => m.id === mealId, (m) => ({
              ...m,
              options: set2(m.options, (o) => o.id === optionId, (o) => ({ ...o, items: [...o.items, { id: uid(), name, grams }] })),
            }))
          ),
        })),

      removeMealItem: (planId, dayId, mealId, optionId, itemId) =>
        set((s) => ({
          db: mapMeals(s.db, planId, dayId, (meals) =>
            set2(meals, (m) => m.id === mealId, (m) => ({
              ...m,
              options: set2(m.options, (o) => o.id === optionId, (o) => ({ ...o, items: o.items.filter((it) => it.id !== itemId) })),
            }))
          ),
        })),

      // Copia las comidas del día indicado al resto de días de la semana
      // (clonando ids para que cada día sea editable de forma independiente).
      copyDayToAll: (planId, dayId) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => {
              const source = p.days.find((d) => d.id === dayId);
              if (!source) return p;
              const clone = (): Meal[] =>
                source.meals.map((m) => ({
                  ...m,
                  id: uid(),
                  options: m.options.map((o) => ({ ...o, id: uid(), items: o.items.map((it) => ({ ...it, id: uid() })) })),
                }));
              return {
                ...p,
                updatedAt: Date.now(),
                days: p.days.map((d) => (d.id === dayId ? d : { ...d, meals: clone() })),
              };
            }),
          },
        })),

      sendMessage: (fromId, toId, text) =>
        set((s) => ({
          db: {
            ...s.db,
            messages: [
              ...s.db.messages,
              { id: uid(), fromId, toId, text, createdAt: Date.now() },
            ],
          },
        })),

      addProgress: (entry) =>
        set((s) => ({
          db: { ...s.db, progress: [...s.db.progress, { ...entry, id: uid() }] },
        })),

      removeProgress: (id) =>
        set((s) => ({
          db: { ...s.db, progress: s.db.progress.filter((p) => p.id !== id) },
        })),

      togglePlanTask: (id) =>
        set((s) => ({
          db: { ...s.db, planTasks: set2(s.db.planTasks ?? [], (t) => t.id === id, (t) => ({ ...t, done: !t.done })) },
        })),

      addPlanTask: ({ clientId, date, type, title, time, body }) =>
        set((s) => ({
          db: {
            ...s.db,
            planTasks: [...(s.db.planTasks ?? []), { id: uid(), clientId, date, type, title, time, body, done: false }],
          },
        })),

      updatePlanTask: (id, patch) =>
        set((s) => ({
          db: { ...s.db, planTasks: set2(s.db.planTasks ?? [], (t) => t.id === id, (t) => ({ ...t, ...patch })) },
        })),

      removePlanTask: (id) =>
        set((s) => ({
          db: { ...s.db, planTasks: (s.db.planTasks ?? []).filter((t) => t.id !== id) },
        })),

      updateUser: (userId, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            users: set2(s.db.users, (u) => u.id === userId, (u) => ({ ...u, ...patch })),
          },
        })),

      addClient: (data) => {
        const id = 'client-' + uid();
        const trainerId = useStore.getState().sessionUserId ?? 'trainer-kike';
        set((s) => ({
          db: {
            ...s.db,
            users: [
              ...s.db.users,
              {
                id,
                name: data.name,
                email: data.email,
                role: 'client',
                trainerId,
                phone: data.phone,
                goal: data.goal,
                status: data.status ?? 'lead',
                since: Date.now(),
              },
            ],
          },
        }));
        return id;
      },

      addReminder: (data) =>
        set((s) => ({
          db: {
            ...s.db,
            reminders: [
              ...(s.db.reminders ?? []),
              { id: uid(), trainerId: s.sessionUserId ?? 'trainer-kike', clientId: data.clientId, text: data.text, due: data.due, done: false },
            ],
          },
        })),

      toggleReminder: (id) =>
        set((s) => ({
          db: { ...s.db, reminders: set2(s.db.reminders ?? [], (r) => r.id === id, (r) => ({ ...r, done: !r.done })) },
        })),

      removeReminder: (id) =>
        set((s) => ({
          db: { ...s.db, reminders: (s.db.reminders ?? []).filter((r) => r.id !== id) },
        })),

      setProfile: (userId, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            users: set2(s.db.users, (u) => u.id === userId, (u) => ({
              ...u,
              profile: { ...u.profile, ...patch },
            })),
          },
        })),

      // AUTOMATIZACIÓN: genera plan de nutrición + entrenamiento a medida a partir
      // del perfil del cliente y su peso más reciente. Reemplaza los planes actuales.
      generatePlanFor: async (clientId) => {
        const s = useStore.getState();
        const user = s.db.users.find((u) => u.id === clientId);
        const p = user?.profile;
        const lastWeight = s.db.progress
          .filter((e) => e.clientId === clientId)
          .sort((a, b) => a.date - b.date)
          .at(-1)?.weightKg;

        if (!user || !p?.heightCm || !p.age || !p.sex || !p.activity || !p.experience || !p.daysPerWeek || !p.goalType) {
          throw new Error('Faltan datos del perfil para generar el plan.');
        }
        if (!lastWeight) {
          throw new Error('Registra tu peso actual antes de generar el plan.');
        }

        const input: PlanInput = {
          clientId,
          weightKg: lastWeight,
          heightCm: p.heightCm,
          age: p.age,
          sex: p.sex,
          activity: p.activity,
          experience: p.experience,
          daysPerWeek: p.daysPerWeek,
          trainingDays: p.trainingDays,
          goalType: p.goalType,
        };

        const result = await planEngine.generate(input);
        // Programa el bloque completo (12 semanas) en el calendario del cliente.
        const schedule = buildScheduleTasks(clientId, result.workout, Date.now());

        set((st) => ({
          db: {
            ...st.db,
            workoutPlans: [
              ...st.db.workoutPlans.filter((w) => w.clientId !== clientId),
              result.workout,
            ],
            nutritionPlans: [
              ...st.db.nutritionPlans.filter((n) => n.clientId !== clientId),
              result.nutrition,
            ],
            planTasks: [
              ...(st.db.planTasks ?? []).filter((t) => t.clientId !== clientId),
              ...schedule,
            ],
            users: set2(st.db.users, (u) => u.id === clientId, (u) => ({
              ...u,
              profile: { ...u.profile, generatedAt: Date.now() },
            })),
          },
        }));

        return { summary: result.summary };
      },

      createWorkoutPlan: (clientId) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: [
              ...s.db.workoutPlans.filter((p) => p.clientId !== clientId),
              {
                id: uid(),
                clientId,
                name: 'Plan personalizado',
                status: 'draft',
                updatedAt: Date.now(),
                days: [],
              },
            ],
          },
        })),

      createNutritionPlan: (clientId) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: [
              ...s.db.nutritionPlans.filter((p) => p.clientId !== clientId),
              {
                id: uid(),
                clientId,
                dailyKcal: 2000,
                protein: 150,
                carbs: 200,
                fat: 60,
                days: emptyNutritionDays(),
                status: 'draft',
                updatedAt: Date.now(),
              },
            ],
          },
        })),

      saveNutritionTemplate: ({ name, dailyKcal, protein, carbs, fat, days }) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionTemplates: [
              ...(s.db.nutritionTemplates ?? []),
              { id: uid(), trainerId: s.sessionUserId ?? 'trainer-kike', name: name.trim() || 'Plan de nutrición', dailyKcal, protein, carbs, fat, days: cloneNutritionDays(days) },
            ],
          },
        })),

      removeNutritionTemplate: (id) =>
        set((s) => ({ db: { ...s.db, nutritionTemplates: (s.db.nutritionTemplates ?? []).filter((t) => t.id !== id) } })),

      applyNutritionTemplate: (planId, templateId) =>
        set((s) => {
          const t = (s.db.nutritionTemplates ?? []).find((x) => x.id === templateId);
          if (!t) return { db: s.db };
          return {
            db: {
              ...s.db,
              nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
                ...p,
                dailyKcal: t.dailyKcal,
                protein: t.protein,
                carbs: t.carbs,
                fat: t.fat,
                days: cloneNutritionDays(t.days),
                updatedAt: Date.now(),
              })),
            },
          };
        }),

      createNutritionFromTemplate: (clientId, templateId) =>
        set((s) => {
          const t = (s.db.nutritionTemplates ?? []).find((x) => x.id === templateId);
          if (!t) return { db: s.db };
          return {
            db: {
              ...s.db,
              nutritionPlans: [
                ...s.db.nutritionPlans.filter((p) => p.clientId !== clientId),
                { id: uid(), clientId, dailyKcal: t.dailyKcal, protein: t.protein, carbs: t.carbs, fat: t.fat, days: cloneNutritionDays(t.days), weeks: 12, status: 'draft', updatedAt: Date.now() },
              ],
            },
          };
        }),

      // El entrenador envía el borrador al cliente: lo marca activo y le avisa por chat.
      publishPlan: (clientId) =>
        set((s) => {
          const client = s.db.users.find((u) => u.id === clientId);
          const nombre = client?.name.split(' ')[0] ?? '';
          const extraMsg =
            client?.trainerId
              ? [{
                  id: uid(),
                  fromId: client.trainerId,
                  toId: clientId,
                  text: `¡${nombre}, tu plan ya está listo! Lo tienes en Entreno y Nutrición. Cualquier duda, aquí estoy. 💪 — Kike`,
                  createdAt: Date.now(),
                }]
              : [];
          return {
            db: {
              ...s.db,
              workoutPlans: s.db.workoutPlans.map((p) =>
                p.clientId === clientId ? { ...p, status: 'active' as const } : p
              ),
              nutritionPlans: s.db.nutritionPlans.map((p) =>
                p.clientId === clientId ? { ...p, status: 'active' as const } : p
              ),
              messages: [...s.db.messages, ...extraMsg],
            },
          };
        }),
    }),
    {
      // Sube la versión cuando cambian los datos semilla (p. ej. vídeos) para que
      // los dispositivos refresquen la demo en vez de quedarse con datos viejos.
      name: 'fitnessencial-db-v13',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ db: s.db, sessionUserId: s.sessionUserId }),
    }
  )
);

// Hidratación desde AsyncStorage (API idiomática de zustand persist).
export function useHydrated() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}

// ---- Selectores de ayuda ----
export const useSession = () => {
  const id = useStore((s) => s.sessionUserId);
  const users = useStore((s) => s.db.users);
  return users.find((u) => u.id === id) ?? null;
};

export const useClientsOf = (trainerId: string) =>
  useStore(useShallow((s) => s.db.users.filter((u) => u.role === 'client' && u.trainerId === trainerId)));

export const useUser = (id?: string) =>
  useStore((s) => s.db.users.find((u) => u.id === id) ?? null);

export const useWorkoutPlan = (clientId?: string) =>
  useStore((s) => s.db.workoutPlans.find((p) => p.clientId === clientId) ?? null);

export const useNutritionPlan = (clientId?: string) =>
  useStore((s) => s.db.nutritionPlans.find((p) => p.clientId === clientId) ?? null);

export const useThread = (a?: string, b?: string) =>
  useStore(
    useShallow((s) =>
      s.db.messages
        .filter((m) => (m.fromId === a && m.toId === b) || (m.fromId === b && m.toId === a))
        .sort((x, y) => x.createdAt - y.createdAt)
    )
  );

export const useProgressOf = (clientId?: string) =>
  useStore(
    useShallow((s) =>
      s.db.progress.filter((p) => p.clientId === clientId).sort((a, b) => a.date - b.date)
    )
  );

// Rutinas guardadas por el entrenador (biblioteca reutilizable).
export const useRoutines = (trainerId?: string): RoutineTemplate[] =>
  useStore(
    useShallow((s) => (s.db.routines ?? []).filter((r) => !trainerId || r.trainerId === trainerId))
  );

// Planes de nutrición guardados por el entrenador (biblioteca reutilizable).
export const useNutritionTemplates = (trainerId?: string): NutritionTemplate[] =>
  useStore(
    useShallow((s) => (s.db.nutritionTemplates ?? []).filter((t) => !trainerId || t.trainerId === trainerId))
  );

// Tareas de la planificación (calendario) de un cliente, ordenadas por fecha.
export const usePlanTasks = (clientId?: string): PlanTask[] =>
  useStore(
    useShallow((s) =>
      (s.db.planTasks ?? []).filter((t) => t.clientId === clientId).sort((a, b) => a.date - b.date)
    )
  );

// ¿El cliente tiene un plan en borrador pendiente de que el entrenador lo envíe?
export const useHasDraft = (clientId?: string) =>
  useStore(
    (s) =>
      s.db.workoutPlans.some((p) => p.clientId === clientId && p.status === 'draft') ||
      s.db.nutritionPlans.some((p) => p.clientId === clientId && p.status === 'draft')
  );

// Recordatorios del entrenador (opcionalmente de un cliente), pendientes primero y por fecha.
export const useReminders = (trainerId: string, clientId?: string) =>
  useStore(
    useShallow((s) =>
      (s.db.reminders ?? [])
        .filter((r) => r.trainerId === trainerId && (clientId ? r.clientId === clientId : true))
        .sort((a, b) => Number(a.done) - Number(b.done) || a.due - b.due)
    )
  );

// Adherencia del cliente (% de series hechas en su plan).
export const useAdherence = (clientId?: string) =>
  useStore(
    useShallow((s) => planAdherence(s.db.workoutPlans.find((p) => p.clientId === clientId)))
  );

// Clientes del entrenador con un plan pendiente de revisar (bandeja tipo CRM).
export const usePendingClients = (trainerId: string) =>
  useStore(
    useShallow((s) => {
      const draftClientIds = new Set([
        ...s.db.workoutPlans.filter((p) => p.status === 'draft').map((p) => p.clientId),
        ...s.db.nutritionPlans.filter((p) => p.status === 'draft').map((p) => p.clientId),
      ]);
      return s.db.users.filter((u) => u.role === 'client' && u.trainerId === trainerId && draftClientIds.has(u.id));
    })
  );
