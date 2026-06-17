import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, EmptyState, IconButton, Row, SectionTitle, Txt } from '@/components/ui';
import { useNutritionPlan, useNutritionTemplates, useStore } from '@/lib/db/store';
import { WEEKDAYS, type MealOption, type NutritionTemplate, type Weekday } from '@/lib/db/types';
import { DEFAULT_FOOD_PHOTO } from '@/lib/foodPhotos';
import { colors, font, radius, space } from '@/lib/theme';

// Día de la semana de hoy (getDay: 0=domingo) en nuestras claves.
const todayWeekday = (): Weekday => (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Weekday[])[new Date().getDay()];

export function NutritionView({ clientId, mode }: { clientId: string; mode: 'client' | 'trainer' }) {
  const plan = useNutritionPlan(clientId);
  const {
    updateNutrition, addMeal, removeMeal, addMealOption, removeMealOption,
    addMealItem, removeMealItem, copyDayToAll, createNutritionPlan,
    saveNutritionTemplate, removeNutritionTemplate, applyNutritionTemplate, createNutritionFromTemplate,
  } = useStore();
  const templates = useNutritionTemplates();
  const [selected, setSelected] = useState<Weekday>(todayWeekday());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  if (!plan) {
    return (
      <View style={{ gap: space.md }}>
        <EmptyState icon="nutrition-outline" text="Aún no hay plan de nutrición." />
        {mode === 'trainer' && (
          <>
            <Button title="Cargar plan guardado" icon="albums-outline" onPress={() => setPickerOpen(true)} />
            <Button title="Crear plan vacío" variant="ghost" icon="add" onPress={() => createNutritionPlan(clientId)} />
            <NutritionTemplatePicker
              visible={pickerOpen}
              templates={templates}
              onClose={() => setPickerOpen(false)}
              onPick={(tid) => { createNutritionFromTemplate(clientId, tid); setPickerOpen(false); }}
              onDelete={removeNutritionTemplate}
            />
          </>
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
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="label">OBJETIVO DIARIO</Txt>
          {plan.weeks ? <Txt variant="mute" style={{ fontSize: 12 }}>Bloque de {plan.weeks} semanas</Txt> : null}
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Macro label="kcal" value={plan.dailyKcal} editable={editable} big onChange={(n) => updateNutrition(plan.id, { dailyKcal: n })} />
          <Macro label="Proteína" value={plan.protein} unit="g" editable={editable} onChange={(n) => updateNutrition(plan.id, { protein: n })} />
          <Macro label="Carbos" value={plan.carbs} unit="g" editable={editable} onChange={(n) => updateNutrition(plan.id, { carbs: n })} />
          <Macro label="Grasas" value={plan.fat} unit="g" editable={editable} onChange={(n) => updateNutrition(plan.id, { fat: n })} />
        </Row>
      </Card>

      {editable && (
        <Row style={{ gap: 8 }}>
          <Button title="Guardar plan" variant="ghost" icon="bookmark-outline" small onPress={() => setSaveOpen(true)} />
          <Button title="Cargar plan guardado" variant="ghost" icon="albums-outline" small onPress={() => setPickerOpen(true)} />
        </Row>
      )}

      {/* Selector de día de la semana */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {WEEKDAYS.map((w) => {
          const active = w.key === selected;
          return (
            <Pressable key={w.key} onPress={() => setSelected(w.key)} style={[st.dayTab, active && st.dayTabActive]}>
              <Txt style={{ color: active ? colors.bg : colors.ink, fontWeight: font.bold, fontSize: 13 }}>{w.short}</Txt>
            </Pressable>
          );
        })}
      </View>

      <Row style={{ justifyContent: 'space-between' }}>
        <SectionTitle>{dayLabel}</SectionTitle>
        {editable && day && (
          <IconButton icon="copy-outline" color={colors.accent} size={18} onPress={() => copyDayToAll(plan.id, day.id)} />
        )}
      </Row>

      {day?.meals.map((meal) => (
        <View key={meal.id} style={{ gap: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row>
              <Txt variant="subtitle">{meal.name}</Txt>
              <Txt variant="mute">{meal.time}</Txt>
            </Row>
            {editable && <IconButton icon="trash-outline" color={colors.danger} size={18} onPress={() => removeMeal(plan.id, day.id, meal.id)} />}
          </Row>
          {!editable && <Txt variant="mute" style={{ fontSize: 13 }}>Elige una de estas opciones:</Txt>}

          {meal.options.map((opt, i) => (
            <OptionCard
              key={opt.id}
              option={opt}
              index={i}
              editable={editable}
              onRemove={() => removeMealOption(plan.id, day.id, meal.id, opt.id)}
              onAddItem={(name, grams) => addMealItem(plan.id, day.id, meal.id, opt.id, name, grams)}
              onRemoveItem={(itemId) => removeMealItem(plan.id, day.id, meal.id, opt.id, itemId)}
            />
          ))}

          {meal.options.length === 0 && <Txt variant="mute">Sin opciones.</Txt>}

          {editable && (
            <Button title="Añadir opción" variant="ghost" small icon="add" onPress={() => addMealOption(plan.id, day.id, meal.id)} />
          )}
        </View>
      ))}

      {day && day.meals.length === 0 && (
        <EmptyState icon="restaurant-outline" text={`Sin comidas para ${dayLabel.toLowerCase()}.`} />
      )}

      {editable && day && <Button title="Añadir comida" variant="ghost" icon="add" onPress={() => addMeal(plan.id, day.id)} />}

      <NutritionTemplatePicker
        visible={pickerOpen}
        templates={templates}
        onClose={() => setPickerOpen(false)}
        onPick={(tid) => { applyNutritionTemplate(plan.id, tid); setPickerOpen(false); }}
        onDelete={removeNutritionTemplate}
      />
      <SaveNutritionModal
        visible={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={(name) => { saveNutritionTemplate({ name, dailyKcal: plan.dailyKcal, protein: plan.protein, carbs: plan.carbs, fat: plan.fat, days: plan.days }); setSaveOpen(false); }}
      />
    </View>
  );
}

// Tarjeta de una opción: foto del plato + nombre + receta (ingredientes).
function OptionCard({ option, index, editable, onRemove, onAddItem, onRemoveItem }: {
  option: MealOption;
  index: number;
  editable: boolean;
  onRemove: () => void;
  onAddItem: (name: string, grams?: number) => void;
  onRemoveItem: (itemId: string) => void;
}) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
      <Image source={{ uri: option.photoUri ?? DEFAULT_FOOD_PHOTO }} style={st.photo} contentFit="cover" transition={200} />

      <View style={{ padding: space.md, gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt variant="label" style={{ color: colors.accent }}>OPCIÓN {index + 1}</Txt>
            <Txt variant="subtitle">{option.name}</Txt>
          </View>
          {editable && <IconButton icon="trash-outline" color={colors.danger} size={18} onPress={onRemove} />}
        </Row>

        {option.items.map((it) => (
          <Row key={it.id} style={{ justifyContent: 'space-between', paddingVertical: 1 }}>
            <Row>
              <View style={st.dot} />
              <Txt variant="body" style={{ color: colors.ink }}>{it.name}</Txt>
            </Row>
            <Row>
              {it.grams ? <Txt variant="mute">{it.grams} g</Txt> : null}
              {editable && <IconButton icon="close" color={colors.mute} size={16} onPress={() => onRemoveItem(it.id)} />}
            </Row>
          </Row>
        ))}
        {option.items.length === 0 && <Txt variant="mute" style={{ fontSize: 13 }}>Sin ingredientes.</Txt>}

        {editable && <AddItem onAdd={onAddItem} />}
      </View>
    </Card>
  );
}

// Modal: elegir un plan de nutrición guardado de la biblioteca.
function NutritionTemplatePicker({ visible, templates, onClose, onPick, onDelete }: {
  visible: boolean;
  templates: NutritionTemplate[];
  onClose: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={mst.backdrop} onPress={onClose}>
        <Pressable style={mst.modalCard} onPress={(e) => e.stopPropagation()}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="title" style={{ fontSize: 19 }}>Planes de nutrición</Txt>
            <IconButton icon="close" color={colors.mute} onPress={onClose} />
          </Row>
          {templates.length === 0 ? (
            <Txt variant="mute" style={{ paddingVertical: space.md }}>Aún no has guardado ningún plan. Crea uno y pulsa “Guardar plan”.</Txt>
          ) : (
            templates.map((t) => (
              <Row key={t.id} style={{ gap: 8 }}>
                <Pressable onPress={() => onPick(t.id)} style={({ pressed }) => [mst.item, pressed && { opacity: 0.7 }]}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="subtitle" style={{ fontSize: 15 }}>{t.name}</Txt>
                    <Txt variant="mute" style={{ fontSize: 12 }}>{t.dailyKcal} kcal · {t.protein}P / {t.carbs}C / {t.fat}G</Txt>
                  </View>
                  <Ionicons name="download-outline" size={20} color={colors.accent} />
                </Pressable>
                <IconButton icon="trash-outline" color={colors.danger} size={18} onPress={() => onDelete(t.id)} />
              </Row>
            ))
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Modal: nombrar y guardar el plan de nutrición actual en la biblioteca.
function SaveNutritionModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={mst.backdrop} onPress={onClose}>
        <Pressable style={mst.modalCard} onPress={(e) => e.stopPropagation()}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="title" style={{ fontSize: 19 }}>Guardar plan de nutrición</Txt>
            <IconButton icon="close" color={colors.mute} onPress={onClose} />
          </Row>
          <Txt variant="mute">Guárdalo en tu biblioteca para reutilizarlo con cualquier cliente.</Txt>
          <TextInput value={name} onChangeText={setName} placeholder="Nombre del plan" placeholderTextColor={colors.mute} style={mst.input} />
          <Button title="Guardar en biblioteca" icon="bookmark" onPress={() => onSave(name.trim() || 'Plan de nutrición')} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const mst = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  modalCard: { width: '100%', maxWidth: 460, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.md, paddingVertical: 12 },
  input: { backgroundColor: colors.bg2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 11, color: colors.ink, fontSize: 15 },
});

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
      <TextInput value={name} onChangeText={setName} placeholder="Ingrediente" placeholderTextColor={colors.mute} style={[st.addInput, { flex: 1 }]} />
      <TextInput value={grams} onChangeText={setGrams} placeholder="g" placeholderTextColor={colors.mute} keyboardType="numeric" style={[st.addInput, { width: 52, textAlign: 'center' }]} />
      <Pressable onPress={add} style={({ pressed }) => [st.addBtn, pressed && { opacity: 0.7 }]}>
        <Txt style={{ color: colors.bg, fontWeight: font.bold }}>+</Txt>
      </Pressable>
    </Row>
  );
}

const st = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  photo: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.bg2 },
  dayTab: {
    flex: 1,
    paddingVertical: 9,
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
