import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Header, Row, Txt } from '@/components/ui';
import { useClientsOf, useSession, useStore } from '@/lib/db/store';
import { colors, font, radius, space } from '@/lib/theme';

const DAY = 86400000;
const WHEN: { k: string; label: string; offset: number }[] = [
  { k: 'hoy', label: 'Hoy', offset: 0 },
  { k: 'man', label: 'Mañana', offset: 1 },
  { k: 'd3', label: 'En 3 días', offset: 3 },
  { k: 'sem', label: 'Próx. semana', offset: 7 },
];

export default function NuevoRecordatorio() {
  const { clientId: presetClient } = useLocalSearchParams<{ clientId?: string }>();
  const me = useSession();
  const clients = useClientsOf(me?.id ?? '');
  const addReminder = useStore((s) => s.addReminder);

  const [text, setText] = useState('');
  const [clientId, setClientId] = useState<string | undefined>(presetClient);
  const [when, setWhen] = useState('hoy');

  const submit = () => {
    if (!text.trim()) {
      Alert.alert('Falta el texto', 'Escribe qué quieres recordar.');
      return;
    }
    const off = WHEN.find((w) => w.k === when)?.offset ?? 0;
    addReminder({ text: text.trim(), clientId, due: Date.now() + off * DAY });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Header title="Nuevo recordatorio" onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Field label="RECORDATORIO" value={text} onChangeText={setText} placeholder="Ej: Llamar a Laura para cerrar plan" />

        <View style={{ gap: 8 }}>
          <Txt variant="label">¿CUÁNDO?</Txt>
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            {WHEN.map((w) => (
              <Chip key={w.k} label={w.label} active={w.k === when} onPress={() => setWhen(w.k)} />
            ))}
          </Row>
        </View>

        <View style={{ gap: 8 }}>
          <Txt variant="label">CLIENTE (opcional)</Txt>
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            <Chip label="General" active={!clientId} onPress={() => setClientId(undefined)} />
            {clients.map((c) => (
              <Chip key={c.id} label={c.name.split(' ')[0]} active={clientId === c.id} onPress={() => setClientId(c.id)} />
            ))}
          </Row>
        </View>

        <Button title="Guardar recordatorio" icon="alarm" onPress={submit} style={{ marginTop: space.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[st.chip, active && st.chipActive]}>
      <Txt style={{ color: active ? colors.bg : colors.inkSoft, fontWeight: font.semibold, fontSize: 14 }}>{label}</Txt>
    </Pressable>
  );
}

const st = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
});
