import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatView } from '@/components/features/ChatView';
import { NutritionView } from '@/components/features/NutritionView';
import { ProgressView } from '@/components/features/ProgressView';
import { WorkoutView } from '@/components/features/WorkoutView';
import { Header, IconButton, Segmented } from '@/components/ui';
import { useSession, useStore, useUser } from '@/lib/db/store';
import { colors, space } from '@/lib/theme';

const SEGMENTS = [
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
  const [tab, setTab] = useState(seg && SEGMENTS.some((s) => s.key === seg) ? seg : 'entreno');

  if (!me || !client) return null;

  const regenerate = () => {
    Alert.alert(
      'Generar plan a medida',
      `¿Regenerar el entreno y la nutrición de ${client.name} con sus datos actuales? Reemplazará los planes existentes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            try {
              const { summary } = await generatePlanFor(client.id);
              Alert.alert('Plan generado ✅', summary);
            } catch (e: any) {
              Alert.alert('No se pudo generar', e?.message ?? 'Revisa el perfil del cliente.');
            }
          },
        },
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
      </View>

      {tab === 'chat' ? (
        <ChatView meId={me.id} otherId={client.id} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, paddingBottom: 48, gap: space.md }} showsVerticalScrollIndicator={false}>
          {tab === 'entreno' && <WorkoutView clientId={client.id} mode="trainer" />}
          {tab === 'nutricion' && <NutritionView clientId={client.id} mode="trainer" />}
          {tab === 'progreso' && <ProgressView clientId={client.id} mode="trainer" />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
