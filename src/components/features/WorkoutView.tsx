import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Button, Card, EmptyState, IconButton, Row, SectionTitle, Txt } from '@/components/ui';
import { hasVideo, openVideoNative, VideoModal, VideoThumb } from '@/components/VideoPlayer';
import { useRoutines, useStore, useWorkoutPlan } from '@/lib/db/store';
import { WEEKDAYS, type Exercise, type RoutineTemplate, type Weekday, type WorkoutDay } from '@/lib/db/types';
import { colors, font, radius, space } from '@/lib/theme';

// Un ejercicio está hecho cuando todas sus series están marcadas.
const exDone = (e: Exercise) => e.sets > 0 && Array.from({ length: e.sets }).every((_, i) => e.logs?.[i]?.done);

// Día de la semana de hoy (getDay: 0=domingo) en nuestras claves.
const todayWeekday = (): Weekday => (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Weekday[])[new Date().getDay()];

export function WorkoutView({ clientId, mode }: { clientId: string; mode: 'client' | 'trainer' }) {
  const plan = useWorkoutPlan(clientId);
  const { logSet, updateExercise, addExercise, removeExercise, addWorkoutDayFor, updateWorkoutDay, removeWorkoutDay, setWeekOverride, resetDayProgress, createWorkoutPlan, saveRoutine, saveFullRoutine, removeRoutine, applyRoutine, addRoutineAsDay, applyFullRoutine, createWorkoutFromRoutine } = useStore();
  const routines = useRoutines();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<Weekday>(todayWeekday());
  // Biblioteca: dónde cargar la rutina elegida (sesión existente, día nuevo o plan entero).
  const [pick, setPick] = useState<{ target: 'day'; dayId: string } | { target: 'newday'; weekday: Weekday } | { target: 'plan' } | { target: 'create' } | null>(null);
  // Guardar como rutina: una sesión concreta o el plan completo.
  const [saveModal, setSaveModal] = useState<{ kind: 'session'; day: WorkoutDay } | { kind: 'full' } | null>(null);
  // Semana del bloque (progresión). 1 = valores base; 2..N usan ajustes por semana.
  const [week, setWeek] = useState(1);

  // En web reproduce en un modal; en móvil abre YouTube/navegador.
  const playVideo = (url: string) => {
    if (Platform.OS === 'web') setVideoUrl(url);
    else openVideoNative(url);
  };

  if (!plan) {
    return (
      <View style={{ gap: space.md }}>
        <EmptyState icon="barbell-outline" text="Aún no hay rutina asignada." />
        {mode === 'trainer' && (
          <>
            <Button title="Cargar rutina guardada" icon="albums-outline" onPress={() => setPick({ target: 'create' })} />
            <Button title="Crear plan vacío" variant="ghost" icon="add" onPress={() => createWorkoutPlan(clientId)} />
            <RoutinePicker
              visible={!!pick}
              kind="all"
              routines={routines}
              onClose={() => setPick(null)}
              onPick={(rid) => { createWorkoutFromRoutine(clientId, rid); setPick(null); }}
              onDelete={removeRoutine}
            />
          </>
        )}
      </View>
    );
  }

  const day = plan.days.find((d) => d.weekday === selected);
  const dayLabel = WEEKDAYS.find((w) => w.key === selected)?.label ?? '';
  const total = day?.exercises.length ?? 0;
  const done = day?.exercises.filter(exDone).length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const weeksCount = plan.weeks ?? 1;
  // Ejercicio con los ajustes de la semana seleccionada aplicados (series/reps/kg).
  const forWeek = (ex: Exercise): Exercise => (week === 1 ? ex : { ...ex, ...(plan.weekOverrides?.[week]?.[ex.id] ?? {}) });
  // Edita series/reps/kg: en semana 1 cambia el valor base; en otras, solo esa semana.
  const editEx = (dayId: string, exId: string, patch: { sets?: number; reps?: string; weightKg?: number }) =>
    week === 1 ? updateExercise(plan.id, dayId, exId, patch) : setWeekOverride(plan.id, week, exId, patch);

  return (
    <View style={{ gap: space.md }}>
      <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />
      <SectionTitle>{plan.name}</SectionTitle>

      {mode === 'trainer' && (
        <Row style={{ gap: 8 }}>
          <Button title="Guardar plan completo" variant="ghost" icon="bookmarks-outline" small onPress={() => setSaveModal({ kind: 'full' })} />
          <Button title="Cargar plan" variant="ghost" icon="albums-outline" small onPress={() => setPick({ target: 'plan' })} />
        </Row>
      )}

      {/* Selector de día de la semana */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {WEEKDAYS.map((w) => {
          const active = w.key === selected;
          const hasSession = plan.days.some((d) => d.weekday === w.key);
          return (
            <Pressable key={w.key} onPress={() => setSelected(w.key)} style={[st.dayTab, active && st.dayTabActive]}>
              <Txt style={{ color: active ? colors.bg : colors.ink, fontWeight: font.bold, fontSize: 13 }}>{w.short}</Txt>
              <View style={[st.dayDot, { backgroundColor: hasSession ? (active ? colors.bg : colors.accent) : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>

      {/* Selector de semana del bloque (progresión) — solo entrenador */}
      {mode === 'trainer' && weeksCount > 1 && (
        <View style={{ gap: 6 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {Array.from({ length: weeksCount }, (_, i) => i + 1).map((w) => {
              const active = w === week;
              const tuned = !!plan.weekOverrides?.[w] && Object.keys(plan.weekOverrides[w]).length > 0;
              return (
                <Pressable key={w} onPress={() => setWeek(w)} style={[st.weekPill, active && st.weekPillActive]}>
                  <Txt style={{ fontSize: 12, fontWeight: font.semibold, color: active ? colors.bg : colors.inkSoft }}>Sem {w}</Txt>
                  {tuned && !active && <View style={st.weekDot} />}
                </Pressable>
              );
            })}
          </ScrollView>
          <Txt variant="mute" style={{ fontSize: 12 }}>
            {week === 1 ? 'Semana base. Edita series/reps/kg aquí para arrancar.' : `Editando solo series/reps/kg de la semana ${week}.`}
          </Txt>
        </View>
      )}

      {!day ? (
        // Día de descanso (sin sesión asignada).
        <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.lg }}>
          <Ionicons name="bed-outline" size={30} color={colors.mute} />
          <Txt variant="subtitle">{dayLabel} · Descanso</Txt>
          <Txt variant="mute" style={{ textAlign: 'center' }}>No hay entreno programado este día.</Txt>
          {mode === 'trainer' && (
            <Row style={{ gap: 8 }}>
              <Button title="Sesión vacía" icon="add" small onPress={() => addWorkoutDayFor(plan.id, selected)} />
              <Button title="Cargar rutina" variant="ghost" icon="albums-outline" small onPress={() => setPick({ target: 'newday', weekday: selected })} />
            </Row>
          )}
        </Card>
      ) : (
        <Card>
          {mode === 'client' ? (
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="subtitle">{day.name}</Txt>
              {total > 0 && <Txt variant="label">{done}/{total}</Txt>}
            </Row>
          ) : (
            <Row style={{ gap: 8 }}>
              <TextInput
                value={day.name}
                onChangeText={(t) => updateWorkoutDay(plan.id, day.id, { name: t })}
                style={[st.editInput, { flex: 1, fontWeight: font.bold, fontSize: 15 }]}
                placeholder="Nombre de la sesión"
                placeholderTextColor={colors.mute}
              />
              <IconButton icon="trash-outline" color={colors.danger} size={20} onPress={() => removeWorkoutDay(plan.id, day.id)} />
            </Row>
          )}

          {mode === 'client' && total > 0 && (
            <View style={st.bar}>
              <View style={[st.barFill, { width: `${pct}%` }]} />
            </View>
          )}

          {day.exercises.map((ex) =>
            mode === 'client' ? (
              <ClientExercise
                key={ex.id}
                ex={ex}
                onLog={(index, patch) => logSet(plan.id, day.id, ex.id, index, patch)}
                onPlay={playVideo}
              />
            ) : (
              ((exW) => (
              <View key={ex.id} style={st.editCard}>
                <TextInput
                  value={ex.name}
                  onChangeText={(t) => updateExercise(plan.id, day.id, ex.id, { name: t })}
                  style={st.editInput}
                  placeholder="Ejercicio"
                  placeholderTextColor={colors.mute}
                />
                <View style={st.editFields}>
                  <NumField label="Series" value={exW.sets} onChange={(n) => editEx(day.id, ex.id, { sets: n })} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt variant="mute" style={{ fontSize: 10 }}>Reps</Txt>
                    <TextInput
                      value={exW.reps}
                      onChangeText={(t) => editEx(day.id, ex.id, { reps: t })}
                      style={[st.editInput, { textAlign: 'center' }]}
                      placeholder="reps"
                      placeholderTextColor={colors.mute}
                    />
                  </View>
                  <NumField label="Kg" value={exW.weightKg ?? 0} onChange={(n) => editEx(day.id, ex.id, { weightKg: n })} />
                  <IconButton icon="trash-outline" color={colors.danger} size={20} onPress={() => removeExercise(plan.id, day.id, ex.id)} style={{ paddingBottom: 8 }} />
                </View>
                <Row style={{ gap: 8 }}>
                  <Ionicons name="videocam" size={18} color={hasVideo(ex.videoUrl) ? colors.accent : colors.mute} />
                  <TextInput
                    value={ex.videoUrl ?? ''}
                    onChangeText={(t) => updateExercise(plan.id, day.id, ex.id, { videoUrl: t })}
                    style={[st.editInput, { flex: 1 }]}
                    placeholder="Enlace del vídeo (YouTube o Drive)"
                    placeholderTextColor={colors.mute}
                    autoCapitalize="none"
                  />
                  {hasVideo(ex.videoUrl) && (
                    <VideoThumb url={ex.videoUrl} onPress={() => playVideo(ex.videoUrl!)} width={58} height={38} />
                  )}
                </Row>
                <LoggedSummary ex={ex} />
              </View>
              ))(forWeek(ex))
            )
          )}

          {day.exercises.length === 0 && <Txt variant="mute">Sin ejercicios todavía.</Txt>}

          {mode === 'trainer' ? (
            <>
              <Button title="Añadir ejercicio" variant="ghost" icon="add" small onPress={() => addExercise(plan.id, day.id)} />
              <Row style={{ gap: 8 }}>
                <Button title="Guardar como rutina" variant="ghost" icon="bookmark-outline" small onPress={() => setSaveModal({ kind: 'session', day })} />
                <Button title="Cargar rutina" variant="ghost" icon="albums-outline" small onPress={() => setPick({ target: 'day', dayId: day.id })} />
              </Row>
            </>
          ) : done > 0 ? (
            <Button title="Reiniciar día" variant="ghost" icon="refresh" small onPress={() => resetDayProgress(plan.id, day.id)} />
          ) : null}
        </Card>
      )}

      <RoutinePicker
        visible={!!pick}
        kind={pick?.target === 'plan' ? 'full' : 'session'}
        routines={routines}
        onClose={() => setPick(null)}
        onPick={(rid) => {
          if (!pick) return;
          if (pick.target === 'day') applyRoutine(plan.id, pick.dayId, rid);
          else if (pick.target === 'newday') addRoutineAsDay(plan.id, pick.weekday, rid);
          else applyFullRoutine(plan.id, rid);
          setPick(null);
        }}
        onDelete={removeRoutine}
      />
      <SaveModal
        modal={saveModal}
        onClose={() => setSaveModal(null)}
        onSave={(name) => {
          if (saveModal?.kind === 'session') saveRoutine({ name, exercises: saveModal.day.exercises });
          else if (saveModal?.kind === 'full') saveFullRoutine({ name, days: plan.days });
          setSaveModal(null);
        }}
      />
    </View>
  );
}

// Cuenta de ejercicios de una rutina (sesión o plan completo).
const routineCount = (r: RoutineTemplate) =>
  r.days ? r.days.reduce((n, d) => n + d.exercises.length, 0) : (r.exercises?.length ?? 0);

// Modal: elegir una rutina guardada de la biblioteca (filtrada por tipo).
function RoutinePicker({ visible, kind, routines, onClose, onPick, onDelete }: {
  visible: boolean;
  kind: 'session' | 'full' | 'all';
  routines: RoutineTemplate[];
  onClose: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const list = routines.filter((r) => (kind === 'all' ? true : kind === 'full' ? !!r.days : !r.days));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.modalCard} onPress={(e) => e.stopPropagation()}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="title" style={{ fontSize: 19 }}>{kind === 'full' ? 'Planes completos' : 'Tus rutinas'}</Txt>
            <IconButton icon="close" color={colors.mute} onPress={onClose} />
          </Row>
          {list.length === 0 ? (
            <Txt variant="mute" style={{ paddingVertical: space.md }}>
              {kind === 'full' ? 'Aún no has guardado ningún plan completo. Pulsa “Guardar plan completo”.' : 'Aún no has guardado ninguna rutina. Crea una sesión y pulsa “Guardar como rutina”.'}
            </Txt>
          ) : (
            list.map((r) => (
              <Row key={r.id} style={{ gap: 8 }}>
                <Pressable onPress={() => onPick(r.id)} style={({ pressed }) => [st.routineItem, pressed && { opacity: 0.7 }]}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="subtitle" style={{ fontSize: 15 }}>{r.name}</Txt>
                    <Txt variant="mute" style={{ fontSize: 12 }}>
                      {r.days ? `${r.days.length} días · ` : ''}{routineCount(r)} ejercicios
                    </Txt>
                  </View>
                  <Ionicons name="download-outline" size={20} color={colors.accent} />
                </Pressable>
                <IconButton icon="trash-outline" color={colors.danger} size={18} onPress={() => onDelete(r.id)} />
              </Row>
            ))
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Modal: nombrar y guardar una sesión o el plan completo como rutina.
function SaveModal({ modal, onClose, onSave }: {
  modal: { kind: 'session'; day: WorkoutDay } | { kind: 'full' } | null;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');
  if (!modal) return null;
  const isFull = modal.kind === 'full';
  const def = isFull ? 'Plan completo' : (modal.day.name || 'Rutina');
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.modalCard} onPress={(e) => e.stopPropagation()}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="title" style={{ fontSize: 19 }}>{isFull ? 'Guardar plan completo' : 'Guardar rutina'}</Txt>
            <IconButton icon="close" color={colors.mute} onPress={onClose} />
          </Row>
          <Txt variant="mute">
            {isFull
              ? 'Guarda toda la semana de entreno en tu biblioteca para reutilizarla con cualquier cliente.'
              : `Guarda esta sesión (${modal.day.exercises.length} ejercicios) en tu biblioteca para reutilizarla.`}
          </Txt>
          <TextInput value={name} onChangeText={setName} placeholder={def} placeholderTextColor={colors.mute} style={st.editInput} />
          <Button title="Guardar en biblioteca" icon="bookmark" onPress={() => onSave(name.trim() || def)} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Vista del cliente: registra kg y reps reales por cada serie.
function ClientExercise({ ex, onLog, onPlay }: { ex: Exercise; onLog: (index: number, patch: Partial<{ weightKg: number; reps: string; done: boolean }>) => void; onPlay: (url: string) => void }) {
  const allDone = exDone(ex);
  const exHasVideo = hasVideo(ex.videoUrl);
  const { width } = useWindowDimensions();
  const wide = width >= 640 && exHasVideo; // en ancho, miniatura a la derecha de la tabla

  const setsTable = (
    <View style={{ gap: 6, marginTop: 4, flex: 1 }}>
      <Row style={{ paddingHorizontal: 4 }}>
        <Txt variant="label" style={{ width: 52, fontSize: 10 }}>SERIE</Txt>
        <Txt variant="label" style={{ width: 96, fontSize: 10, textAlign: 'center' }}>KG</Txt>
        <Txt variant="label" style={{ width: 84, fontSize: 10, textAlign: 'center' }}>REPS</Txt>
        <View style={{ width: 34 }} />
      </Row>
      {Array.from({ length: ex.sets }).map((_, i) => {
        const log = ex.logs?.[i];
        const done = !!log?.done;
        return (
          <Row key={i} style={st.setRow}>
            <Txt style={{ width: 52, color: colors.inkSoft, fontWeight: font.semibold }}>{i + 1}ª</Txt>
            <TextInput
              value={log?.weightKg != null ? String(log.weightKg) : ''}
              onChangeText={(t) => onLog(i, { weightKg: Number(t.replace(',', '.').replace(/[^0-9.]/g, '')) || 0 })}
              keyboardType="numeric"
              placeholder={ex.weightKg ? String(ex.weightKg) : '–'}
              placeholderTextColor={colors.mute}
              style={[st.setInput, { width: 96 }]}
            />
            <TextInput
              value={log?.reps ?? ''}
              onChangeText={(t) => onLog(i, { reps: t })}
              keyboardType="numeric"
              placeholder={ex.reps}
              placeholderTextColor={colors.mute}
              style={[st.setInput, { width: 84 }]}
            />
            <Pressable onPress={() => onLog(i, { done: !done })} hitSlop={8} style={{ width: 34, alignItems: 'center' }}>
              <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={done ? colors.success : colors.mute} />
            </Pressable>
          </Row>
        );
      })}
    </View>
  );

  return (
    <View style={st.clientEx}>
      <Row style={{ justifyContent: 'space-between', gap: 8 }}>
        <Row style={{ flex: 1, gap: 8 }}>
          <Ionicons name={allDone ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={allDone ? colors.success : colors.mute} />
          <View style={{ flex: 1 }}>
            <Txt variant="subtitle" style={[{ fontSize: 16 }, allDone && st.strike]}>{ex.name}</Txt>
            <Txt variant="mute" style={{ fontSize: 12 }}>
              {ex.sets}×{ex.reps}{ex.weightKg ? ` · ${ex.weightKg}kg` : ''}
            </Txt>
          </View>
        </Row>
      </Row>
      {ex.note ? <Txt variant="mute" style={{ fontStyle: 'italic', marginLeft: 30 }}>{ex.note}</Txt> : null}

      {/* En móvil: previsualización del vídeo a todo el ancho (16:9, frame entero) */}
      {exHasVideo && !wide && (
        <Pressable onPress={() => onPlay(ex.videoUrl!)} style={({ pressed }) => [{ marginTop: 6 }, pressed && { opacity: 0.85 }]}>
          <VideoThumb url={ex.videoUrl} full onPress={() => onPlay(ex.videoUrl!)} />
          <Row style={{ gap: 6, marginTop: 6 }}>
            <Ionicons name="play-circle" size={18} color={colors.accent} />
            <Txt style={{ color: colors.accent, fontWeight: font.semibold, fontSize: 13 }}>Ver vídeo de Kike</Txt>
          </Row>
        </Pressable>
      )}

      {wide ? (
        <Row style={{ gap: space.md, alignItems: 'flex-start', marginTop: 4 }}>
          {setsTable}
          <Pressable onPress={() => onPlay(ex.videoUrl!)} style={({ pressed }) => [st.bigThumb, pressed && { opacity: 0.85 }]}>
            <VideoThumb url={ex.videoUrl} onPress={() => onPlay(ex.videoUrl!)} width={260} height={146} />
            <Row style={{ gap: 6, justifyContent: 'center', marginTop: 6 }}>
              <Ionicons name="play-circle" size={18} color={colors.accent} />
              <Txt style={{ color: colors.accent, fontWeight: font.semibold, fontSize: 13 }}>Ver vídeo de Kike</Txt>
            </Row>
          </Pressable>
        </Row>
      ) : (
        setsTable
      )}
    </View>
  );
}

// Vista del entrenador: muestra, claro y grande, lo que el cliente hizo por serie.
function LoggedSummary({ ex }: { ex: Exercise }) {
  const logs = (ex.logs ?? []).slice(0, ex.sets);
  const anyLogged = logs.some((l) => l.done || (l.weightKg != null && l.weightKg > 0) || (l.reps && l.reps !== ex.reps));

  if (!anyLogged) {
    return <Txt variant="mute" style={{ fontSize: 12, fontStyle: 'italic' }}>Sin registrar aún por el cliente</Txt>;
  }

  return (
    <View style={st.logged}>
      <Row style={{ gap: 6 }}>
        <Ionicons name="checkmark-done" size={16} color={colors.accent} />
        <Txt variant="label" style={{ fontSize: 11, color: colors.accent }}>LO QUE HIZO EL CLIENTE</Txt>
      </Row>
      <View style={st.loggedTable}>
        {Array.from({ length: ex.sets }).map((_, i) => {
          const l = ex.logs?.[i];
          const has = !!(l && (l.done || (l.weightKg != null && l.weightKg > 0)));
          return (
            <Row key={i} style={[st.loggedRow, i > 0 && st.loggedRowBorder]}>
              <Txt style={{ width: 64, color: colors.mute, fontWeight: font.semibold, fontSize: 13 }}>Serie {i + 1}</Txt>
              <Row style={{ flex: 1, justifyContent: 'flex-end', gap: 4 }}>
                <Txt style={{ color: has ? colors.ink : colors.mute, fontWeight: font.bold, fontSize: 18 }}>
                  {l?.weightKg ? l.weightKg : '–'}
                </Txt>
                <Txt style={{ color: colors.mute, fontSize: 12, marginRight: 10 }}>kg</Txt>
                <Txt style={{ color: has ? colors.ink : colors.mute, fontWeight: font.bold, fontSize: 18 }}>
                  {has ? l?.reps || '–' : '–'}
                </Txt>
                <Txt style={{ color: colors.mute, fontSize: 12 }}>reps</Txt>
              </Row>
              <View style={{ width: 26, alignItems: 'flex-end' }}>
                <Ionicons name={l?.done ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={l?.done ? colors.success : colors.line} />
              </View>
            </Row>
          );
        })}
      </View>
    </View>
  );
}

function NumField({ value, onChange, label }: { value: number; onChange: (n: number) => void; label?: string }) {
  return (
    <View style={{ width: 56, gap: 3 }}>
      {label && <Txt variant="mute" style={{ fontSize: 10 }}>{label}</Txt>}
      <TextInput
        value={String(value)}
        onChangeText={(t) => onChange(Number(t.replace(/[^0-9.]/g, '')) || 0)}
        keyboardType="numeric"
        style={[st.editInput, { textAlign: 'center' }]}
      />
    </View>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  modalCard: { width: '100%', maxWidth: 460, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  routineItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.md, paddingVertical: 12 },
  weekPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg2 },
  weekPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  weekDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  dayTab: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg2, alignItems: 'center', gap: 4 },
  dayTabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.bg2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  strike: { textDecorationLine: 'line-through', color: colors.mute },
  clientEx: { gap: 4, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  bigThumb: { alignItems: 'center' },
  videoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginLeft: 30, marginTop: 2, paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.line },
  setRow: { gap: 8 },
  setInput: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: colors.ink,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: font.semibold,
  },
  editCard: { gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  logged: { gap: 8, marginTop: 2, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  loggedTable: { backgroundColor: colors.bg2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 },
  loggedRow: { paddingVertical: 9 },
  loggedRowBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  editFields: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  editInput: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.ink,
    fontSize: 14,
  },
});
