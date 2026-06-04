import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Header, Row, Txt } from '@/components/ui';
import { useStore } from '@/lib/db/store';
import type { ClientStatus } from '@/lib/db/types';
import { colors, font, radius, space } from '@/lib/theme';

const STATUS: { k: ClientStatus; label: string }[] = [
  { k: 'lead', label: 'Lead (prospecto)' },
  { k: 'active', label: 'Cliente activo' },
];

export default function NuevoCliente() {
  const addClient = useStore((s) => s.addClient);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState<ClientStatus>('lead');

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Faltan datos', 'Pon al menos nombre y email.');
      return;
    }
    const id = addClient({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, goal: goal.trim() || undefined, status });
    router.replace(`/(trainer)/cliente/${id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg }}>
        <Header title="Nuevo cliente" subtitle="Añade un cliente o un lead" onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Field label="NOMBRE" value={name} onChangeText={setName} placeholder="Nombre y apellidos" />
        <Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="email@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="TELÉFONO (opcional)" value={phone} onChangeText={setPhone} placeholder="+34 600 000 000" keyboardType="phone-pad" />
        <Field label="OBJETIVO (opcional)" value={goal} onChangeText={setGoal} placeholder="Perder grasa, ganar músculo…" />

        <View style={{ gap: 8 }}>
          <Txt variant="label">ESTADO</Txt>
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            {STATUS.map((s) => {
              const active = s.k === status;
              return (
                <Pressable key={s.k} onPress={() => setStatus(s.k)} style={[st.chip, active && st.chipActive]}>
                  <Txt style={{ color: active ? colors.bg : colors.inkSoft, fontWeight: font.semibold, fontSize: 14 }}>{s.label}</Txt>
                </Pressable>
              );
            })}
          </Row>
        </View>

        <Button title="Guardar cliente" icon="person-add" onPress={submit} style={{ marginTop: space.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
});
