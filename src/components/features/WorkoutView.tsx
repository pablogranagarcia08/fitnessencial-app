import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, EmptyState, IconButton, Row, SectionTitle, Txt } from '@/components/ui';
import { useStore, useWorkoutPlan } from '@/lib/db/store';
import type { Exercise } from '@/lib/db/types';
import { colors, font, radius, space } from '@/lib/theme';

// Un ejercicio está hecho cuando todas sus series están marcadas.
const exDone = (e: Exercise) => e.sets > 0 && Array.from({ length: e.sets }).every((_, i) => e.logs?.[i]?.done);

export function WorkoutView({ clientId, mode }: { clientId: string; mode: 'client' | 'trainer' }) {
  const plan = useWorkoutPlan(clientId);
  const { logSet, updateExercise, addExercise, removeExercise, addWorkoutDay, resetDayProgress } = useStore();

  if (!plan) {
    return <EmptyState icon="barbell-outline" text="Aún no hay rutina asignada." />;
  }

  return (
    <View style={{ gap: space.md }}>
      <SectionTitle>{plan.name}</SectionTitle>

      {plan.days.map((day) => {
        const total = day.exercises.length;
        const done = day.exercises.filter(exDone).length;
        const pct = total ? Math.round((done / total) * 100) : 0;

        return (
          <Card key={day.id}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="subtitle">{day.name}</Txt>
              {mode === 'client' && total > 0 && <Txt variant="label">{done}/{total}</Txt>}
            </Row>

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
                />
              ) : (
                <View key={ex.id} style={st.editCard}>
                  <TextInput
                    value={ex.name}
                    onChangeText={(t) => updateExercise(plan.id, day.id, ex.id, { name: t })}
                    style={st.editInput}
                    placeholder="Ejercicio"
                    placeholderTextColor={colors.mute}
                  />
                  <View style={st.editFields}>
                    <NumField label="Series" value={ex.sets} onChange={(n) => updateExercise(plan.id, day.id, ex.id, { sets: n })} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Txt variant="mute" style={{ fontSize: 10 }}>Reps</Txt>
                      <TextInput
                        value={ex.reps}
                        onChangeText={(t) => updateExercise(plan.id, day.id, ex.id, { reps: t })}
                        style={[st.editInput, { textAlign: 'center' }]}
                        placeholder="reps"
                        placeholderTextColor={colors.mute}
                      />
                    </View>
                    <NumField label="Kg" value={ex.weightKg ?? 0} onChange={(n) => updateExercise(plan.id, day.id, ex.id, { weightKg: n })} />
                    <IconButton icon="trash-outline" color={colors.danger} size={20} onPress={() => removeExercise(plan.id, day.id, ex.id)} style={{ paddingBottom: 8 }} />
                  </View>
                  <LoggedSummary ex={ex} />
                </View>
              )
            )}

            {day.exercises.length === 0 && <Txt variant="mute">Sin ejercicios todavía.</Txt>}

            {mode === 'trainer' ? (
              <Button title="Añadir ejercicio" variant="ghost" icon="add" small onPress={() => addExercise(plan.id, day.id)} />
            ) : done > 0 ? (
              <Button title="Reiniciar día" variant="ghost" icon="refresh" small onPress={() => resetDayProgress(plan.id, day.id)} />
            ) : null}
          </Card>
        );
      })}

      {mode === 'trainer' && (
        <Button title="Añadir día de entreno" variant="ghost" icon="calendar" onPress={() => addWorkoutDay(plan.id)} />
      )}
    </View>
  );
}

// Vista del cliente: registra kg y reps reales por cada serie.
function ClientExercise({ ex, onLog }: { ex: Exercise; onLog: (index: number, patch: Partial<{ weightKg: number; reps: string; done: boolean }>) => void }) {
  const allDone = exDone(ex);
  return (
    <View style={st.clientEx}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ flex: 1, gap: 8 }}>
          <Ionicons name={allDone ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={allDone ? colors.success : colors.mute} />
          <Txt variant="subtitle" style={[{ fontSize: 16, flexShrink: 1 }, allDone && st.strike]}>{ex.name}</Txt>
        </Row>
        <Txt variant="mute" style={{ fontSize: 12 }}>
          objetivo: {ex.sets}×{ex.reps}{ex.weightKg ? ` · ${ex.weightKg}kg` : ''}
        </Txt>
      </Row>
      {ex.note ? <Txt variant="mute" style={{ fontStyle: 'italic', marginLeft: 30 }}>{ex.note}</Txt> : null}

      <View style={{ gap: 6, marginTop: 4 }}>
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
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.bg2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  strike: { textDecorationLine: 'line-through', color: colors.mute },
  clientEx: { gap: 4, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
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
