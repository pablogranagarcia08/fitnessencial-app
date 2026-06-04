import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { planEngine, type PlanInput } from '../plan/engine';
import { makeSeed } from './seed';
import type { ClientProfile, DB, Exercise, Meal, NutritionPlan, ProgressEntry, SetLog, WorkoutDay } from './types';

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

  // nutrición
  updateNutrition: (planId: string, patch: Partial<NutritionPlan>) => void;
  addMeal: (planId: string) => void;
  removeMeal: (planId: string, mealId: string) => void;
  addMealItem: (planId: string, mealId: string, name: string, grams?: number) => void;
  removeMealItem: (planId: string, mealId: string, itemId: string) => void;

  // chat
  sendMessage: (fromId: string, toId: string, text: string) => void;

  // progreso
  addProgress: (entry: Omit<ProgressEntry, 'id'>) => void;
  removeProgress: (id: string) => void;

  // perfil + automatización de planes
  setProfile: (userId: string, patch: Partial<ClientProfile>) => void;
  generatePlanFor: (clientId: string) => Promise<{ summary: string }>;
  publishPlan: (clientId: string) => void; // enviar borrador al cliente (lo activa)
}

const set2 = <T,>(arr: T[], pred: (x: T) => boolean, fn: (x: T) => T): T[] =>
  arr.map((x) => (pred(x) ? fn(x) : x));

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

      addMeal: (planId) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              meals: [...p.meals, { id: uid(), name: 'Nueva comida', time: '12:00', items: [] } as Meal],
            })),
          },
        })),

      removeMeal: (planId, mealId) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              meals: p.meals.filter((m) => m.id !== mealId),
            })),
          },
        })),

      addMealItem: (planId, mealId, name, grams) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              meals: set2(p.meals, (m) => m.id === mealId, (m) => ({
                ...m,
                items: [...m.items, { id: uid(), name, grams }],
              })),
            })),
          },
        })),

      removeMealItem: (planId, mealId, itemId) =>
        set((s) => ({
          db: {
            ...s.db,
            nutritionPlans: set2(s.db.nutritionPlans, (p) => p.id === planId, (p) => ({
              ...p,
              updatedAt: Date.now(),
              meals: set2(p.meals, (m) => m.id === mealId, (m) => ({
                ...m,
                items: m.items.filter((it) => it.id !== itemId),
              })),
            })),
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
      name: 'fitnessencial-db-v1',
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

// ¿El cliente tiene un plan en borrador pendiente de que el entrenador lo envíe?
export const useHasDraft = (clientId?: string) =>
  useStore(
    (s) =>
      s.db.workoutPlans.some((p) => p.clientId === clientId && p.status === 'draft') ||
      s.db.nutritionPlans.some((p) => p.clientId === clientId && p.status === 'draft')
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
