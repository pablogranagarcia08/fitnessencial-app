import { generatePlanLocal, type GeneratedPlan, type PlanInput } from './generate';

// Interfaz del motor de planes. Hoy: fórmulas locales. Mañana: IA real (Claude)
// vía backend. Las pantallas no cambian: solo se cambia `planEngine` aquí.
export interface PlanEngine {
  id: string;
  label: string;
  generate(input: PlanInput): Promise<GeneratedPlan>;
}

// Motor por fórmulas profesionales (funciona offline, en el móvil).
export const localEngine: PlanEngine = {
  id: 'local-formulas',
  label: 'Fórmulas pro (offline)',
  async generate(input) {
    return generatePlanLocal(input);
  },
};

// Motor de IA (Claude). Requiere backend con clave API — NO se mete en el móvil.
// Cuando exista el servidor, este `generate` hará un fetch al endpoint que llama a Claude.
export const aiEngine: PlanEngine = {
  id: 'ai-claude',
  label: 'IA Claude (requiere backend)',
  async generate() {
    throw new Error(
      'El motor de IA necesita el backend (Supabase + servidor con clave API). Disponible en la siguiente fase.'
    );
  },
};

// Motor activo. Cambiar a `aiEngine` cuando el backend esté listo.
export const planEngine: PlanEngine = localEngine;

export type { GeneratedPlan, PlanInput };
