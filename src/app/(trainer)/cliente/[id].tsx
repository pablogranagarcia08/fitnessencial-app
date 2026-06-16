import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatView } from '@/components/features/ChatView';
import { ClientCRM } from '@/components/features/ClientCRM';
import { NutritionView } from '@/components/features/NutritionView';
import { PlanningView } from '@/components/features/PlanningView';
import { ProgressView } from '@/components/features/ProgressView';
import { WorkoutView } from '@/components/features/WorkoutView';
import { Button, Header, IconButton, Row, Segmented, Txt } from '@/components/ui';
import { useHasDraft, useSession, useStore, useUser } from '@/lib/db/store';
import { colors, radius, space } from '@/lib/theme';

const SEGMENTS = [
  { key: 'ficha', label: 'Ficha' },
  { key: 'plan', label: 'Plan' },
  { key: 'entreno', label: 'Entreno' },
  { key: 'nutricion', label: 'Nutrición' },
  { key: 'progreso', label: 'Progreso' },
  { key: 'chat', label: 'Chat' },
];

export default function ClienteDetalle() {
  const { id, seg } = useLocalSearchParams<{ id: string; seg?: string }>();
  const me = useSession();
  const client = useUser(id);
  const generatePlanFor = useStore((s) => s.generatePlanFor);
  const publishPlan = useStore((s) => s.publishPlan);
  const pending = useHasDraft(id);
  const [tab, setTab] = useState(seg && SEGMENTS.some((s) => s.key === seg) ? seg : 'ficha');

  if (!me || !client) return null;

  const firstName = client.name.split(' ')[0];

  const sendToClient = () => {
    const done = () => {
      publishPlan(client.id);
      router.replace('/(trainer)/revisar');
    };
    if (Platform.OS === 'web') return done(); // Alert es no-op en web
    Alert.alert('Enviar plan', `¿Enviar el plan a ${client.name}? Lo verá en su app al instante.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: done },
    ]);
  };

  const doRegenerate = async () => {
    try {
      const { summary } = await generatePlanFor(client.id);
      if (Platform.OS !== 'web') Alert.alert('Plan regenerado ✅', summary);
    } catch (e: any) {
      Alert.alert('No se pudo generar', e?.message ?? 'Revisa el perfil del cliente.');
    }
  };

  const regenerate = () => {
    if (Platform.OS === 'web') return doRegenerate();
    Alert.alert(
      'Rehacer plan a medida',
      `¿Regenerar el entreno y la nutrición de ${client.name} con sus datos actuales? Quedará como borrador para que lo revises y lo envíes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Rehacer', onPress: doRegenerate },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: space.lg, paddingBottom: space.sm, gap: space.md }}>
        <Header
          title={client.name}
          subtitle={client.goal}
          onBack={() => router.back()}
          right={<IconButton icon="refresh" color={colors.accent} onPress={regenerate} />}
        />
        <Segmented options={SEGMENTS} value={tab} onChange={setTab} />
        {pending && tab !== 'ficha' && (
          <View style={st.banner}>
            <Row style={{ gap: 8 }}>
              <Ionicons name="hourglass-outline" size={18} color={colors.accent} />
              <Txt style={{ flex: 1, color: colors.ink, fontSize: 13 }}>
                Plan pendiente de revisar. Ajusta lo que veas y envíaselo a {firstName}.
              </Txt>
            </Row>
            <Button title={`Enviar a ${firstName}`} icon="paper-plane" small onPress={sendToClient} />
          </View>
        )}
      </View>

      {tab === 'chat' ? (
        <ChatView meId={me.id} otherId={client.id} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, paddingBottom: 48, gap: space.md }} showsVerticalScrollIndicator={false}>
          {tab === 'ficha' && (
            <ClientCRM
              clientId={client.id}
              pending={pending}
              onMessage={() => setTab('chat')}
              onRegenerate={regenerate}
              onSend={sendToClient}
            />
          )}
          {tab === 'plan' && <PlanningView clientId={client.id} mode="trainer" />}
          {tab === 'entreno' && <WorkoutView clientId={client.id} mode="trainer" />}
          {tab === 'nutricion' && <NutritionView clientId={client.id} mode="trainer" />}
          {tab === 'progreso' && <ProgressView clientId={client.id} mode="trainer" />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  banner: {
    gap: space.sm,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
  },
});
