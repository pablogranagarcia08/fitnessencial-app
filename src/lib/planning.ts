import { Ionicons } from '@expo/vector-icons';
import type { PlanTaskType } from './db/types';
import { colors } from './theme';

// ---------- Metadatos visuales por tipo de tarea ----------
export const TASK_META: Record<PlanTaskType, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  nutrition: { label: 'Nutrición', color: '#2dd4bf', icon: 'restaurant-outline' },
  cardio: { label: 'Caminar', color: '#fb5b8b', icon: 'walk-outline' },
  workout: { label: 'Entreno', color: '#f5a623', icon: 'barbell-outline' },
  message: { label: 'Mensaje programado', color: '#a78bfa', icon: 'chatbubble-ellipses-outline' },
  metric: { label: 'Métricas personales', color: colors.accent, icon: 'analytics-outline' },
  photo: { label: 'Foto de progreso', color: colors.accent2, icon: 'camera-outline' },
  note: { label: 'Nota', color: colors.mute, icon: 'document-text-outline' },
};

export const TASK_ORDER: PlanTaskType[] = ['workout', 'nutrition', 'cardio', 'metric', 'photo', 'message', 'note'];

// ---------- Fechas (sin librerías externas) ----------
export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

// Lunes de la semana que contiene ts (semana L→D).
export const startOfWeek = (ts: number) => {
  const d = new Date(startOfDay(ts));
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  return d.getTime() - dow * DAY;
};

export const startOfMonth = (ts: number) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

export const addMonths = (ts: number, n: number) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
};

// Rejilla del mes: 6 semanas (42 días) empezando en el lunes de la 1ª semana.
export const monthGrid = (ts: number): number[] => {
  const first = startOfWeek(startOfMonth(ts));
  return Array.from({ length: 42 }, (_, i) => first + i * DAY);
};

export const weekDays = (ts: number): number[] => {
  const first = startOfWeek(ts);
  return Array.from({ length: 7 }, (_, i) => first + i * DAY);
};

// "1 – 7 jun" para la cabecera de la vista semana.
export const weekRangeLabel = (ts: number): string => {
  const days = weekDays(ts);
  const a = new Date(days[0]);
  const b = new Date(days[6]);
  const mesA = MONTHS[a.getMonth()].slice(0, 3).toLowerCase();
  const mesB = MONTHS[b.getMonth()].slice(0, 3).toLowerCase();
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${mesB}`
    : `${a.getDate()} ${mesA} – ${b.getDate()} ${mesB}`;
};

export const dayLabel = (ts: number): string => {
  const d = new Date(ts);
  const wd = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][(d.getDay() + 6) % 7];
  return `${wd}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}`;
};

export const monthLabel = (ts: number): string => {
  const d = new Date(ts);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// "13 junio 2026" — título del modal de día.
export const fullDateLabel = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
};

// "13 junio" — fecha corta dentro de las tarjetas de tarea.
export const shortDateLabel = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`;
};
