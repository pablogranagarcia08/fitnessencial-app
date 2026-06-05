import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, EmptyState, IconButton, Row, SectionTitle, Txt } from '@/components/ui';
import { useNutritionPlan, useStore } from '@/lib/db/store';
import { WEEKDAYS, type Weekday } from '@/lib/db/types';
import { colors, font, radius, space } from '@/lib/theme';

// Día de la semana de hoy (getDay: 0=domingo) en nuestras claves.
const todayWeekday = (): Weekday => (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Weekday[])[new Date().getDay()];

export function NutritionView({ clientId, mode }: { clientId: string; mode: 'client' | 'trainer' }) {
  const plan = useNutritionPlan(clientId);
  const { updateNutrition, addMeal, removeMeal, addMealItem, removeMealItem, copyDayToAll, createNutritionPlan } = useStore();
  const [selected, setSelected] = useState<Weekday>(todayWeekday());

  if (!plan) {
    return (
      <View style={{ gap: space.md }}>
        <EmptyState icon="nutrition-outline" text="Aún no hay plan de nutrición." />
        {mode === 'trainer' && (
          <Button title="Crear plan de nutrición" icon="add" onPress={() => createNutritionPlan(clientId)} />
        )}
      </View>
    );
  }

  const editable = mode === 'trainer';
  const day = plan.days.find((d) => d.weekday === selected) ?? plan.days[0];
  const dayLabel = WEEKDAYS.find((w) => w.key === selected)?.label ?? '';

  return (
    <View style={{ gap: space.md }}>
      <Card>
        <Txt variant="label">OBJETIVO DIARIO</Txt>
        <Row style={{ justifyContent: 'space-between' }}>
          <Macro label="kcal" value={plan.dailyKcal} editable={editable} big onChange={(n) => updateNutrition(plan.id, { dailyKcal: n })} />
          <Macro label="Proteína" value={plan.protein} unit="g" editable={editable} onChange={(n) => updateNutrition(plan.id, { protein: n })} />
          <Macro label="Carbos" value={plan.carbs} unit="g" editable={editable} onChange={(n) => updateNutrition(plan.id, { carbs: n })} />
          <Macro label="Grasas" value={plan.fat} unit="g" editable={editable} onChange={(n) => updateNutrition(plan.id, { fat: n })} />
        </Row>
      </Card>

      {/* Selector de día de la semana */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {WEEKDAYS.map((w) => {
          const active = w.key === selected;
          return (
            <Pressable key={w.key} onPress={() => setSelected(w.key)} style={[st.dayTab, active && st.dayTabActive]}>
              <Txt style={{ color: active ? colors.bg : colors.ink, fontWeight: font.bold, fontSize: 13 }}>{w.short}</Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <Row style={{ justifyContent: 'space-between' }}>
        <SectionTitle>{dayLabel}</SectionTitle>
        {editable && day && (
          <IconButton icon="copy-outline" color={colors.accent} size={18} onPress={() => copyDayToAll(plan.id, day.id)} />
        )}
      </Row>

      {day?.meals.map((meal) => (
        <Card key={meal.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row>
              <Txt variant="subtitle">{meal.name}</Txt>
              <Txt variant="mute">{meal.time}</Txt>
            </Row>
            {editable && <IconButton icon="trash-outline" color={colors.danger} size={18} onPress={() => removeMeal(plan.id, day.id, meal.id)} />}
          </Row>

          {meal.items.map((it) => (
            <Row key={it.id} style={{ justifyContent: 'space-between', paddingVertical: 2 }}>
              <Row>
                <View style={st.dot} />
                <Txt variant="body" style={{ color: colors.ink }}>{it.name}</Txt>
              </Row>
              <Row>
                {it.grams ? <Txt variant="mute">{it.grams} g</Txt> : null}
                {editable && <IconButton icon="close" color={colors.mute} size={16} onPress={() => removeMealItem(plan.id, day.id, meal.id, it.id)} />}
              </Row>
            </Row>
          ))}

          {meal.items.length === 0 && <Txt variant="mute">Sin alimentos.</Txt>}

          {editable && <AddItem onAdd={(name, grams) => addMealItem(plan.id, day.id, meal.id, name, grams)} />}
        </Card>
      ))}

      {day && day.meals.length === 0 && (
        <EmptyState icon="restaurant-outline" text={`Sin comidas para ${dayLabel.toLowerCase()}.`} />
      )}

      {editable && day && <Button title="Añadir comida" variant="ghost" icon="add" onPress={() => addMeal(plan.id, day.id)} />}
    </View>
  );
}

function Macro({ label, value, unit, big, editable, onChange }: { label: string; value: number; unit?: string; big?: boolean; editable: boolean; onChange: (n: number) => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      {editable ? (
        <TextInput
          value={String(value)}
          onChangeText={(t) => onChange(Number(t.replace(/[^0-9]/g, '')) || 0)}
          keyboardType="numeric"
          style={[st.macroInput, big && { fontSize: 22, width: 70 }]}
        />
      ) : (
        <Txt style={{ fontSize: big ? 24 : 18, fontWeight: font.bold, color: big ? colors.accent : colors.ink }}>
          {value}{unit}
        </Txt>
      )}
      <Txt variant="mute" style={{ fontSize: 11 }}>{label}</Txt>
    </View>
  );
}

function AddItem({ onAdd }: { onAdd: (name: string, grams?: number) => void }) {
  const [name, setName] = useState('');
  const [grams, setGrams] = useState('');
  const add = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), grams ? Number(grams) : undefined);
    setName('');
    setGrams('');
  };
  return (
    <Row style={{ marginTop: 4 }}>
      <TextInput value={name} onChangeText={setName} placeholder="Alimento" placeholderTextColor={colors.mute} style={[st.addInput, { flex: 1 }]} />
      <TextInput value={grams} onChangeText={setGrams} placeholder="g" placeholderTextColor={colors.mute} keyboardType="numeric" style={[st.addInput, { width: 52, textAlign: 'center' }]} />
      <Pressable onPress={add} style={({ pressed }) => [st.addBtn, pressed && { opacity: 0.7 }]}>
        <Txt style={{ color: colors.bg, fontWeight: font.bold }}>+</Txt>
      </Pressable>
    </Row>
  );
}

const st = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  dayTab: {
    minWidth: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg2,
    alignItems: 'center',
  },
  dayTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  macroInput: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: colors.ink,
    fontSize: 16,
    fontWeight: font.bold,
    minWidth: 48,
    textAlign: 'center',
  },
  addInput: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.ink,
    fontSize: 14,
  },
  addBtn: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
