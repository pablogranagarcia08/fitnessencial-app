import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { LineChart } from '@/components/chart';
import { Button, Card, EmptyState, IconButton, Row, SectionTitle, Txt } from '@/components/ui';
import { useProgressOf, useStore } from '@/lib/db/store';
import { colors, font, radius, space } from '@/lib/theme';

export function ProgressView({ clientId, mode }: { clientId: string; mode: 'client' | 'trainer' }) {
  const entries = useProgressOf(clientId);
  const addProgress = useStore((s) => s.addProgress);
  const removeProgress = useStore((s) => s.removeProgress);
  const { width } = useWindowDimensions();

  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const save = () => {
    const w = Number(weight.replace(',', '.'));
    if (!w) return;
    addProgress({
      clientId,
      date: Date.now(),
      weightKg: w,
      waistCm: waist ? Number(waist.replace(',', '.')) : undefined,
      photoUri,
    });
    setWeight('');
    setWaist('');
    setPhotoUri(undefined);
    setOpen(false);
  };

  const chartData = entries.map((e, i) => ({ x: i, y: e.weightKg }));
  const last = entries[entries.length - 1];
  const first = entries[0];
  const delta = last && first ? last.weightKg - first.weightKg : 0;

  return (
    <View style={{ gap: space.md }}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="label">PESO (kg)</Txt>
          {entries.length >= 2 && (
            <Txt style={{ color: delta <= 0 ? colors.success : colors.warn, fontWeight: font.bold }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
            </Txt>
          )}
        </Row>
        <LineChart data={chartData} width={width - space.lg * 2 - space.md * 2} unit="" />
      </Card>

      {mode === 'client' && (
        open ? (
          <Card>
            <SectionTitle>Nuevo registro</SectionTitle>
            <Row>
              <View style={{ flex: 1, gap: 6 }}>
                <Txt variant="label">PESO (kg)</Txt>
                <TextInput value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="66.4" placeholderTextColor={colors.mute} style={st.input} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Txt variant="label">CINTURA (cm)</Txt>
                <TextInput value={waist} onChangeText={setWaist} keyboardType="numeric" placeholder="78" placeholderTextColor={colors.mute} style={st.input} />
              </View>
            </Row>
            <Pressable onPress={pickPhoto} style={st.photoPick}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={st.photoPreview} contentFit="cover" />
              ) : (
                <Row style={{ justifyContent: 'center' }}>
                  <Ionicons name="camera-outline" size={20} color={colors.accent} />
                  <Txt style={{ color: colors.accent, fontWeight: font.semibold }}>Añadir foto de progreso</Txt>
                </Row>
              )}
            </Pressable>
            <Row>
              <Button title="Cancelar" variant="ghost" small onPress={() => setOpen(false)} style={{ flex: 1 }} />
              <Button title="Guardar" icon="checkmark" small onPress={save} style={{ flex: 1 }} />
            </Row>
          </Card>
        ) : (
          <Button title="Registrar progreso" icon="add" onPress={() => setOpen(true)} />
        )
      )}

      <SectionTitle>Historial</SectionTitle>
      {entries.length === 0 ? (
        <EmptyState icon="trending-up-outline" text="Sin registros aún." />
      ) : (
        [...entries].reverse().map((e) => (
          <Card key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            {e.photoUri ? (
              <Image source={{ uri: e.photoUri }} style={st.thumb} contentFit="cover" />
            ) : (
              <View style={[st.thumb, st.thumbEmpty]}>
                <Ionicons name="body-outline" size={22} color={colors.mute} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Txt variant="subtitle">{e.weightKg} kg</Txt>
              <Txt variant="mute">
                {new Date(e.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                {e.waistCm ? ` · cintura ${e.waistCm} cm` : ''}
              </Txt>
            </View>
            {mode === 'client' && <IconButton icon="trash-outline" color={colors.mute} size={18} onPress={() => removeProgress(e.id)} />}
          </Card>
        ))
      )}
    </View>
  );
}

const st = StyleSheet.create({
  input: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 15,
  },
  photoPick: {
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    padding: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: { width: '100%', height: 160, borderRadius: radius.sm },
  thumb: { width: 54, height: 54, borderRadius: radius.sm },
  thumbEmpty: { backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
});
