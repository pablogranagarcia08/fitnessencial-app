import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Field, Header, Row, SectionTitle, Txt } from '@/components/ui';
import { useSession, useStore } from '@/lib/db/store';
import type { Activity, Experience, GoalType, Sex } from '@/lib/db/types';
import { colors, font, radius, space } from '@/lib/theme';

const SEX: { k: Sex; label: string }[] = [{ k: 'm', label: 'Hombre' }, { k: 'f', label: 'Mujer' }];
const ACTIVITY: { k: Activity; label: string }[] = [
  { k: 'sed', label: 'Sedentario' },
  { k: 'light', label: 'Ligero' },
  { k: 'mod', label: 'Moderado' },
  { k: 'high', label: 'Alto' },
];
const EXPERIENCE: { k: Experience; label: string }[] = [
  { k: 'beg', label: 'Principiante' },
  { k: 'int', label: 'Intermedio' },
  { k: 'adv', label: 'Avanzado' },
];
const GOAL: { k: GoalType; label: string }[] = [
  { k: 'fatloss', label: 'Perder grasa' },
  { k: 'muscle', label: 'Ganar músculo' },
  { k: 'maintain', label: 'Mantenerme' },
];
const DAYS = [2, 3, 4, 5, 6];

export default function Onboarding() {
  const me = useSession();
  const { setProfile, addProgress, generatePlanFor } = useStore();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(me?.profile?.heightCm ? String(me.profile.heightCm) : '');
  const [age, setAge] = useState(me?.profile?.age ? String(me.profile.age) : '');
  const [sex, setSex] = useState<Sex | undefined>(me?.profile?.sex);
  const [activity, setActivity] = useState<Activity | undefined>(me?.profile?.activity);
  const [experience, setExperience] = useState<Experience | undefined>(me?.profile?.experience);
  const [days, setDays] = useState<number | undefined>(me?.profile?.daysPerWeek);
  const [goalType, setGoalType] = useState<GoalType | undefined>(me?.profile?.goalType);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!me) return null;

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled) setPhotos((p) => [...p, res.assets[0].uri]);
  };

  const submit = async () => {
    const w = Number(weight.replace(',', '.'));
    const h = Number(height);
    const a = Number(age);
    if (!w || !h || !a || !sex || !activity || !experience || !days || !goalType) {
      Alert.alert('Faltan datos', 'Completa todos los campos para generar tu plan.');
      return;
    }
    setLoading(true);
    try {
      setProfile(me.id, { heightCm: h, age: a, sex, activity, experience, daysPerWeek: days, goalType });
      // Guarda el peso + fotos de estado como registro de progreso.
      addProgress({ clientId: me.id, date: Date.now(), weightKg: w, photoUri: photos[0] });
      photos.slice(1).forEach((uri) => addProgress({ clientId: me.id, date: Date.now(), weightKg: w, photoUri: uri }));

      await generatePlanFor(me.id);
      // Navega directo (funciona en web y en móvil; Alert es no-op en web).
      router.replace('/(client)/entreno');
    } catch (e: any) {
      Alert.alert('No se pudo generar', e?.message ?? 'Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Header title="Tu plan a medida" subtitle="Cuéntanos sobre ti y lo generamos" onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Card>
          <Row>
            <View style={{ flex: 1 }}>
              <Field label="PESO ACTUAL (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="66" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="ALTURA (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="170" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="EDAD" value={age} onChangeText={setAge} keyboardType="numeric" placeholder="30" />
            </View>
          </Row>
        </Card>

        <Chips label="SEXO" options={SEX.map((x) => ({ k: x.k, label: x.label }))} value={sex} onChange={setSex} />
        <Chips label="NIVEL DE ACTIVIDAD DIARIA" options={ACTIVITY.map((x) => ({ k: x.k, label: x.label }))} value={activity} onChange={setActivity} />
        <Chips label="EXPERIENCIA ENTRENANDO" options={EXPERIENCE.map((x) => ({ k: x.k, label: x.label }))} value={experience} onChange={setExperience} />
        <Chips label="DÍAS POR SEMANA" options={DAYS.map((d) => ({ k: d, label: String(d) }))} value={days} onChange={setDays} />
        <Chips label="TU OBJETIVO" options={GOAL.map((x) => ({ k: x.k, label: x.label }))} value={goalType} onChange={setGoalType} />

        <SectionTitle>Fotos de tu estado actual</SectionTitle>
        <Txt variant="mute">Opcional pero recomendado. Solo las ve tu entrenador.</Txt>
        <Row style={{ flexWrap: 'wrap' }}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={st.photo} contentFit="cover" />
          ))}
          <Pressable onPress={pickPhoto} style={st.addPhoto}>
            <Ionicons name="camera-outline" size={24} color={colors.accent} />
            <Txt variant="mute" style={{ fontSize: 11 }}>Añadir</Txt>
          </Pressable>
        </Row>

        <Button title={loading ? 'Generando…' : 'Generar mi plan a medida'} icon="sparkles" loading={loading} onPress={submit} style={{ marginTop: space.sm }} />
        <Txt variant="mute" style={{ textAlign: 'center', fontSize: 12 }}>
          El plan es un borrador personalizado que Kike revisa antes de validarlo.
        </Txt>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chips<T extends string | number>({ label, options, value, onChange }: { label: string; options: { k: T; label: string }[]; value?: T; onChange: (v: T) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="label">{label}</Txt>
      <Row style={{ flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = o.k === value;
          return (
            <Pressable key={String(o.k)} onPress={() => onChange(o.k)} style={[st.chip, active && st.chipActive]}>
              <Txt style={{ color: active ? colors.bg : colors.inkSoft, fontWeight: font.semibold, fontSize: 14 }}>{o.label}</Txt>
            </Pressable>
          );
        })}
      </Row>
    </View>
  );
}

const st = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  photo: { width: 88, height: 110, borderRadius: radius.sm },
  addPhoto: { width: 88, height: 110, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
});
