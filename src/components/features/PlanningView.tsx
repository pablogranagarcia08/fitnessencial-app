import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Card, IconButton, Row, Txt } from '@/components/ui';
import { usePlanTasks, useStore } from '@/lib/db/store';
import type { PlanTask, PlanTaskType } from '@/lib/db/types';
import {
  addMonths, DAY, dayLabel, fullDateLabel, monthGrid, monthLabel, shortDateLabel, startOfDay, startOfMonth,
  TASK_META, TASK_ORDER, weekDays, weekRangeLabel, WEEKDAY_LABELS,
} from '@/lib/planning';
import { colors, font, radius, space } from '@/lib/theme';

type ViewMode = 'month' | 'week' | 'day';

export function PlanningView({ clientId, mode }: { clientId: string; mode: 'client' | 'trainer' }) {
  const tasks = usePlanTasks(clientId);
  const { togglePlanTask, addPlanTask, removePlanTask } = useStore();
  const [view, setView] = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState(() => startOfDay(Date.now()));
  const [modalDay, setModalDay] = useState<number | null>(null);
  const editable = mode === 'trainer';

  // Agrupa las tareas por día (clave = inicio del día) y ordena por tipo.
  const byDay = useMemo(() => {
    const map = new Map<number, PlanTask[]>();
    tasks.forEach((t) => {
      const k = startOfDay(t.date);
      const arr = map.get(k) ?? [];
      arr.push(t);
      map.set(k, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => TASK_ORDER.indexOf(a.type) - TASK_ORDER.indexOf(b.type)));
    return map;
  }, [tasks]);

  const tasksOf = (ts: number) => byDay.get(startOfDay(ts)) ?? [];

  // Días visibles según la vista, para el recuento de la cabecera.
  const visibleDays = useMemo(() => {
    if (view === 'day') return [anchor];
    if (view === 'week') return weekDays(anchor);
    const d = new Date(anchor);
    const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const first = startOfMonth(anchor);
    return Array.from({ length: total }, (_, i) => first + i * DAY);
  }, [view, anchor]);

  const visibleTasks = visibleDays.flatMap(tasksOf);
  const done = visibleTasks.filter((t) => t.done).length;
  const pending = visibleTasks.length - done;

  const step = (dir: number) => {
    if (view === 'month') setAnchor(addMonths(anchor, dir));
    else setAnchor(anchor + dir * (view === 'week' ? 7 : 1) * DAY);
  };

  const periodLabel = view === 'month' ? monthLabel(anchor) : view === 'week' ? weekRangeLabel(anchor) : dayLabel(anchor);

  // Al tocar un día (en Mes o Semana) se abre el modal con sus tareas.
  const openDay = (ts: number) => setModalDay(startOfDay(ts));

  return (
    <View style={{ gap: space.md }}>
      {/* Selector de vista */}
      <View style={st.viewSeg}>
        {(['month', 'week', 'day'] as ViewMode[]).map((v) => {
          const active = v === view;
          return (
            <Pressable key={v} onPress={() => setView(v)} style={[st.viewSegItem, active && st.viewSegActive]}>
              <Txt style={{ color: active ? colors.bg : colors.inkSoft, fontWeight: font.semibold, fontSize: 13 }}>
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {/* Navegación de periodo */}
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 4 }}>
          <IconButton icon="chevron-back" onPress={() => step(-1)} />
          <IconButton icon="chevron-forward" onPress={() => step(1)} />
          <Pressable onPress={() => setAnchor(startOfDay(Date.now()))} style={st.todayBtn}>
            <Txt style={{ color: colors.ink, fontWeight: font.semibold, fontSize: 13 }}>Hoy</Txt>
          </Pressable>
        </Row>
        <Txt variant="subtitle" style={{ textTransform: 'capitalize' }}>{periodLabel}</Txt>
      </Row>

      {/* Recuento */}
      <Row style={{ gap: space.lg }}>
        <Row style={{ gap: 6 }}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Txt variant="mute"><Txt style={{ color: colors.ink, fontWeight: font.bold }}>{done}</Txt> completadas</Txt>
        </Row>
        <Row style={{ gap: 6 }}>
          <Ionicons name="alert-circle" size={16} color={colors.warn} />
          <Txt variant="mute"><Txt style={{ color: colors.ink, fontWeight: font.bold }}>{pending}</Txt> sin completar</Txt>
        </Row>
      </Row>

      {view === 'month' && <MonthView anchor={anchor} tasksOf={tasksOf} onDay={openDay} />}
      {view === 'week' && <WeekView anchor={anchor} tasksOf={tasksOf} onDay={openDay} />}
      {view === 'day' && (
        <DayView
          anchor={anchor}
          tasks={tasksOf(anchor)}
          editable={editable}
          onToggle={togglePlanTask}
          onRemove={removePlanTask}
          onAdd={(type, title) => addPlanTask({ clientId, date: anchor, type, title })}
        />
      )}

      <DayModal
        day={modalDay}
        tasks={modalDay != null ? tasksOf(modalDay) : []}
        editable={editable}
        onClose={() => setModalDay(null)}
        onToggle={togglePlanTask}
        onRemove={removePlanTask}
        onAdd={(type, title) => modalDay != null && addPlanTask({ clientId, date: modalDay, type, title })}
      />
    </View>
  );
}

// ---------- Modal de día (al tocar una fecha) ----------
function DayModal({ day, tasks, editable, onClose, onToggle, onRemove, onAdd }: {
  day: number | null;
  tasks: PlanTask[];
  editable: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (type: PlanTaskType, title: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<PlanTaskType>('workout');
  const [title, setTitle] = useState('');
  if (day == null) return null;

  const submit = () => {
    onAdd(type, title.trim() || TASK_META[type].label);
    setTitle('');
    setAdding(false);
  };
  const close = () => { setAdding(false); setTitle(''); onClose(); };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable style={st.backdrop} onPress={close}>
        <Pressable style={st.modalCard} onPress={(e) => e.stopPropagation()}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Txt variant="title" style={{ textTransform: 'capitalize', fontSize: 20 }}>{fullDateLabel(day)}</Txt>
              <Txt variant="mute">Estas son las tareas del día</Txt>
            </View>
            <IconButton icon="close" color={colors.mute} onPress={close} />
          </Row>

          <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: space.sm, paddingVertical: space.sm }} showsVerticalScrollIndicator={false}>
            {tasks.length === 0 && <Txt variant="mute" style={{ paddingVertical: space.md }}>No hay tareas programadas este día.</Txt>}
            {tasks.map((t) => {
              const meta = TASK_META[t.type];
              return (
                <Card key={t.id} soft style={{ gap: 8 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Pressable onPress={() => onToggle(t.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[st.modalDot, { backgroundColor: meta.color, opacity: t.done ? 0.4 : 1 }]} />
                      <Txt variant="subtitle" style={{ flex: 1, textDecorationLine: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }} numberOfLines={2}>
                        {t.title}
                      </Txt>
                    </Pressable>
                    {t.done && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                    {editable && <IconButton icon="trash-outline" color={colors.danger} size={18} onPress={() => onRemove(t.id)} />}
                  </Row>
                  <Row style={{ gap: 6 }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.mute} />
                    <Txt variant="mute" style={{ fontSize: 13 }}>{shortDateLabel(t.date)}</Txt>
                    <Ionicons name="time-outline" size={14} color={colors.mute} style={{ marginLeft: 8 }} />
                    <Txt variant="mute" style={{ fontSize: 13 }}>Todo el día</Txt>
                  </Row>
                  <Row style={{ gap: 6 }}>
                    <Ionicons name={meta.icon} size={14} color={meta.color} />
                    <Txt style={{ fontSize: 13, color: colors.inkSoft }}>{meta.label}</Txt>
                  </Row>
                </Card>
              );
            })}
          </ScrollView>

          {editable && adding && (
            <View style={{ gap: space.sm }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {ADD_TYPES.map((ty) => {
                  const active = ty === type;
                  return (
                    <Pressable key={ty} onPress={() => setType(ty)} style={[st.typePill, active && { backgroundColor: TASK_META[ty].color, borderColor: TASK_META[ty].color }]}>
                      <Txt style={{ fontSize: 12, fontWeight: font.semibold, color: active ? colors.bg : colors.inkSoft }}>{TASK_META[ty].label}</Txt>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Row>
                <TextInput value={title} onChangeText={setTitle} placeholder={TASK_META[type].label} placeholderTextColor={colors.mute} style={st.addInput} />
                <Pressable onPress={submit} style={st.saveBtn}><Txt style={{ color: colors.bg, fontWeight: font.bold }}>OK</Txt></Pressable>
              </Row>
            </View>
          )}

          {editable && !adding && (
            <Pressable onPress={() => setAdding(true)} style={st.addNewBtn}>
              <Txt style={{ color: colors.bg, fontWeight: font.bold, fontSize: 15 }}>Añadir nuevo</Txt>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------- Vista MES ----------
function MonthView({ anchor, tasksOf, onDay }: { anchor: number; tasksOf: (ts: number) => PlanTask[]; onDay: (ts: number) => void }) {
  const grid = monthGrid(anchor);
  const month = new Date(anchor).getMonth();
  const todayK = startOfDay(Date.now());
  const weeks = Array.from({ length: 6 }, (_, w) => grid.slice(w * 7, w * 7 + 7));

  return (
    <View style={st.calBox}>
      <Row style={{ gap: 0 }}>
        {WEEKDAY_LABELS.map((d, i) => (
          <View key={i} style={st.dowCell}><Txt variant="mute" style={{ fontSize: 12 }}>{d}</Txt></View>
        ))}
      </Row>
      {weeks.map((week, wi) => (
        <Row key={wi} style={{ gap: 0 }}>
          {week.map((ts) => {
            const inMonth = new Date(ts).getMonth() === month;
            const isToday = startOfDay(ts) === todayK;
            const dayTasks = tasksOf(ts);
            return (
              <Pressable key={ts} onPress={() => onDay(ts)} style={[st.cell, !inMonth && { opacity: 0.35 }]}>
                <View style={[st.cellNum, isToday && st.cellToday]}>
                  <Txt style={{ fontSize: 12, fontWeight: isToday ? font.bold : font.regular, color: isToday ? colors.bg : colors.inkSoft }}>
                    {new Date(ts).getDate()}
                  </Txt>
                </View>
                <View style={st.dots}>
                  {dayTasks.slice(0, 4).map((t) => (
                    <View key={t.id} style={[st.dot, { backgroundColor: TASK_META[t.type].color, opacity: t.done ? 0.4 : 1 }]} />
                  ))}
                  {dayTasks.length > 4 && <Txt style={{ fontSize: 9, color: colors.mute }}>+{dayTasks.length - 4}</Txt>}
                </View>
              </Pressable>
            );
          })}
        </Row>
      ))}
      <Txt variant="mute" style={{ fontSize: 12, marginTop: 4 }}>Toca un día para ver el detalle.</Txt>
    </View>
  );
}

// ---------- Vista SEMANA ----------
function WeekView({ anchor, tasksOf, onDay }: { anchor: number; tasksOf: (ts: number) => PlanTask[]; onDay: (ts: number) => void }) {
  const days = weekDays(anchor);
  const todayK = startOfDay(Date.now());
  return (
    <View style={{ gap: space.sm }}>
      {days.map((ts) => {
        const dayTasks = tasksOf(ts);
        const isToday = startOfDay(ts) === todayK;
        return (
          <Pressable key={ts} onPress={() => onDay(ts)}>
            <Card soft style={{ gap: 8, borderColor: isToday ? colors.accent : colors.line }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt variant="subtitle" style={{ textTransform: 'capitalize', fontSize: 15 }}>{dayLabel(ts)}</Txt>
                {isToday && <Txt style={{ color: colors.accent, fontSize: 12, fontWeight: font.bold }}>HOY</Txt>}
              </Row>
              {dayTasks.length === 0 ? (
                <Txt variant="mute" style={{ fontSize: 13 }}>Sin tareas</Txt>
              ) : (
                <View style={{ gap: 4 }}>
                  {dayTasks.map((t) => <Chip key={t.id} task={t} />)}
                </View>
              )}
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Vista DÍA ----------
const ADD_TYPES: PlanTaskType[] = ['workout', 'nutrition', 'cardio', 'metric', 'photo', 'message', 'note'];

function DayView({ anchor, tasks, editable, onToggle, onRemove, onAdd }: {
  anchor: number;
  tasks: PlanTask[];
  editable: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (type: PlanTaskType, title: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<PlanTaskType>('workout');
  const [title, setTitle] = useState('');

  const submit = () => {
    const text = title.trim() || TASK_META[type].label;
    onAdd(type, text);
    setTitle('');
    setAdding(false);
  };

  return (
    <View style={{ gap: space.sm }}>
      {tasks.length === 0 && <Txt variant="mute">No hay tareas programadas este día.</Txt>}
      {tasks.map((t) => {
        const meta = TASK_META[t.type];
        return (
          <Card key={t.id} style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Pressable onPress={() => onToggle(t.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Ionicons name={t.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={t.done ? colors.success : colors.mute} />
                <View style={[st.tag, { backgroundColor: meta.color }]}>
                  <Ionicons name={meta.icon} size={13} color={colors.bg} />
                </View>
                <Txt style={{ flex: 1, color: colors.ink, textDecorationLine: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }}>
                  {t.title}
                </Txt>
              </Pressable>
              {editable && <IconButton icon="trash-outline" color={colors.danger} size={18} onPress={() => onRemove(t.id)} />}
            </Row>
          </Card>
        );
      })}

      {editable && !adding && (
        <Pressable onPress={() => setAdding(true)} style={st.addTaskBtn}>
          <Ionicons name="add" size={18} color={colors.accent} />
          <Txt style={{ color: colors.accent, fontWeight: font.semibold }}>Añadir tarea</Txt>
        </Pressable>
      )}

      {editable && adding && (
        <Card style={{ gap: space.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {ADD_TYPES.map((ty) => {
              const active = ty === type;
              return (
                <Pressable key={ty} onPress={() => setType(ty)} style={[st.typePill, active && { backgroundColor: TASK_META[ty].color, borderColor: TASK_META[ty].color }]}>
                  <Txt style={{ fontSize: 12, fontWeight: font.semibold, color: active ? colors.bg : colors.inkSoft }}>{TASK_META[ty].label}</Txt>
                </Pressable>
              );
            })}
          </ScrollView>
          <Row>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={TASK_META[type].label}
              placeholderTextColor={colors.mute}
              style={st.addInput}
            />
            <Pressable onPress={submit} style={st.saveBtn}><Txt style={{ color: colors.bg, fontWeight: font.bold }}>OK</Txt></Pressable>
            <IconButton icon="close" color={colors.mute} onPress={() => { setAdding(false); setTitle(''); }} />
          </Row>
        </Card>
      )}
    </View>
  );
}

function Chip({ task }: { task: PlanTask }) {
  const meta = TASK_META[task.type];
  return (
    <Row style={[st.chip, { backgroundColor: meta.color + '22', borderColor: meta.color + '55', opacity: task.done ? 0.55 : 1 }]}>
      <Ionicons name={meta.icon} size={12} color={meta.color} />
      <Txt style={{ fontSize: 12, color: colors.ink, flex: 1, textDecorationLine: task.done ? 'line-through' : 'none' }} numberOfLines={1}>
        {task.title}
      </Txt>
    </Row>
  );
}

const st = StyleSheet.create({
  viewSeg: { flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.line },
  viewSegItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.pill },
  viewSegActive: { backgroundColor: colors.accent },
  todayBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg2 },

  calBox: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: space.sm },
  dowCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  cell: { flex: 1, aspectRatio: 0.82, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineSoft, padding: 3, gap: 3 },
  cellNum: { width: 22, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  cellToday: { backgroundColor: colors.accent },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },

  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, gap: 6 },
  tag: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },

  addTaskBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  modalCard: { width: '100%', maxWidth: 460, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  modalDot: { width: 12, height: 12, borderRadius: 6 },
  addNewBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: space.xs },
  typePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg2 },
  addInput: { flex: 1, backgroundColor: colors.bg2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 10, color: colors.ink, fontSize: 14 },
  saveBtn: { width: 44, height: 40, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
