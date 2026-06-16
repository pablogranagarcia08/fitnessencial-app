import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { planEngine, type PlanInput } from '../plan/engine';
import { makeSeed } from './seed';
import type { ClientProfile, ClientStatus, DB, Exercise, Meal, NutritionDay, NutritionPlan, PlanTask, PlanTaskType, ProgressEntry, SetLog, User, WorkoutDay, WorkoutPlan } from './types';
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
  addWorkoutDay: (planId: string) => void;
  resetDayProgress: (planId: string, dayId: string) => void;

  // nutrición (dieta por día de la semana)
  updateNutrition: (planId: string, patch: Partial<NutritionPlan>) => void;
  addMeal: (planId: string, dayId: string) => void;
  removeMeal: (planId: string, dayId: string, mealId: string) => void;
  addMealItem: (planId: string, dayId: string, mealId: string, name: string, grams?: number) => void;
  removeMealItem: (planId: string, dayId: string, mealId: string, itemId: string) => void;
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

// 7 días vacíos (lunes→domingo) para un plan de nutrición nuevo.
const emptyNutritionDays = (): NutritionDay[] =>
  WEEKDAYS.map((wd) => ({ id: uid(), weekday: wd.key, meals: [] }));

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

      addWorkoutDay: (planId) =>
        set((s) => ({
          db: {
            ...s.db,
            workoutPlans: set2(s.db.workoutPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: [...p.days, { id: uid(), name: `Día ${p.days.length + 1}`, exercises: [] } as WorkoutDay],
            })),
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

      addMeal: (planId, dayId) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                meals: [...d.meals, { id: uid(), name: 'Nueva comida', time: '12:00', items: [] } as Meal],
              })),
            })),
          },
        })),

      removeMeal: (planId, dayId, mealId) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                meals: d.meals.filter((m) => m.id !== mealId),
              })),
            })),
          },
        })),

      addMealItem: (planId, dayId, mealId, name, grams) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                meals: set2(d.meals, (m) => m.id === mealId, (m) => ({
                  ...m,
                  items: [...m.items, { id: uid(), name, grams }],
                })),
              })),
            })),
          },
        })),

      removeMealItem: (planId, dayId, mealId, itemId) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              days: set2(p.days, (d) => d.id === dayId, (d) => ({
                ...d,
                meals: set2(d.meals, (m) => m.id === mealId, (m) => ({
                  ...m,
                  items: m.items.filter((it) => it.id !== itemId),
                })),
              })),
            })),
          },
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
                  items: m.items.map((it) => ({ ...it, id: uid() })),
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
          goalType: p.goalType,
        };

        const result = await planEngine.generate(input);

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
                days: [{ id: uid(), name: 'Día 1', exercises: [] }],
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
      name: 'fitnessencial-db-v6',
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
