import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Card, Header, IconButton, Row, Screen, Txt } from '@/components/ui';
import { useNutritionPlan, useProgressOf, useSession, useStore, useUser, useWorkoutPlan } from '@/lib/db/store';
import { colors, font, space } from '@/lib/theme';

export default function Hoy() {
  const me = useSession();
  const trainer = useUser(me?.trainerId);
  const plan = useWorkoutPlan(me?.id);
  const nutrition = useNutritionPlan(me?.id);
  const progress = useProgressOf(me?.id);
  if (!me) return null;

  const weekdayKey = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[new Date().getDay()];
  const today = plan?.days.find((d) => d.weekday === weekdayKey);
  const exDone = (e: { sets: number; logs?: { done: boolean }[] }) =>
    e.sets > 0 && Array.from({ length: e.sets }).every((_, i) => e.logs?.[i]?.done);
  const doneCount = today?.exercises.filter(exDone).length ?? 0;
  const total = today?.exercises.length ?? 0;
  const lastWeight = progress[progress.length - 1]?.weightKg;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const logout = () => {
    useStore.getState().logout();
    router.replace('/login');
  };

  return (
    <Screen>
      <Header
        title={`${greet},`}
        subtitle={me.name}
        right={
          <Row style={{ gap: 4 }}>
            <IconButton icon="log-out-outline" color={colors.mute} onPress={logout} />
            <Avatar name={me.name} uri={me.avatarUri} size={44} />
          </Row>
        }
      />

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="label">TU ENTRENADOR</Txt>
          <Ionicons name="ribbon" size={18} color={colors.accent} />
        </Row>
        <Row>
          <Avatar name={trainer?.name ?? 'Entrenador'} userId={trainer?.id} size={44} />
          <View>
            <Txt variant="subtitle">{trainer?.name}</Txt>
            <Txt variant="mute">{me.goal}</Txt>
          </View>
        </Row>
      </Card>

      <Pressable onPress={() => router.push('/(client)/onboarding' as Href)} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        <View style={hs.cta}>
          <Avatar name={trainer?.name ?? 'Kike'} userId={trainer?.id} size={40} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt style={{ color: colors.bg, fontWeight: font.bold, fontSize: 16 }}>
              {me.profile?.generatedAt ? 'Ajustar tu plan con Kike' : 'Pídele tu plan a Kike'}
            </Txt>
            <Txt style={{ color: colors.bg, opacity: 0.85, fontSize: 13 }}>
              {me.profile?.generatedAt
                ? 'Actualiza tus datos y Kike te lo adapta'
                : 'Cuéntale tus datos y te prepara entreno y nutrición'}
            </Txt>
          </View>
          <Ionicons name="arrow-forward" size={22} color={colors.bg} />
        </View>
      </Pressable>

      <Tile
        icon="barbell"
        title="Entreno de hoy"
        sub={plan?.status === 'draft' ? 'Kike lo está preparando…' : today ? `${today.name} · ${doneCount}/${total} completado` : plan ? 'Descanso hoy 💤' : 'Sin rutina'}
        onPress={() => router.push('/(client)/entreno')}
      />
      <Tile
        icon="nutrition"
        title="Nutrición"
        sub={nutrition?.status === 'draft' ? 'Kike la está preparando…' : nutrition ? `${nutrition.dailyKcal} kcal · ${nutrition.protein}g proteína` : 'Sin plan'}
        onPress={() => router.push('/(client)/nutricion')}
      />
      <Tile
        icon="calendar"
        title="Mi planificación"
        sub="Tu calendario de 12 semanas"
        onPress={() => router.push('/(client)/plan' as Href)}
      />
      <Tile
        icon="trending-up"
        title="Progreso"
        sub={lastWeight ? `Último peso · ${lastWeight} kg` : 'Registra tu primer dato'}
        onPress={() => router.push('/(client)/progreso')}
      />
      <Tile
        icon="chatbubble-ellipses"
        title="Chat con tu entrenador"
        sub="Escríbele cuando quieras"
        onPress={() => router.push('/(client)/chat')}
      />
    </Screen>
  );
}

function Tile({ icon, title, sub, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ flex: 1 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon} size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="subtitle">{title}</Txt>
              <Txt variant="mute">{sub}</Txt>
            </View>
          </Row>
          <Ionicons name="chevron-forward" size={20} color={colors.mute} />
        </Row>
      </Card>
    </Pressable>
  );
}

const hs = StyleSheet.create({
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: space.md,
  },
});
