import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Avatar, Card, EmptyState, Header, Row, Screen, Txt } from '@/components/ui';
import { useClientsOf, useProgressOf, useSession } from '@/lib/db/store';
import { colors } from '@/lib/theme';

export default function Clientes() {
  const me = useSession();
  const clients = useClientsOf(me?.id ?? '');
  if (!me) return null;

  return (
    <Screen>
      <Header title="Clientes" subtitle={`${clients.length} activos`} right={<Avatar name={me.name} userId={me.id} size={44} />} />
      {clients.length === 0 ? (
        <EmptyState icon="people-outline" text="Aún no tienes clientes." />
      ) : (
        clients.map((c) => <ClientRow key={c.id} id={c.id} name={c.name} goal={c.goal ?? ''} />)
      )}
    </Screen>
  );
}

function ClientRow({ id, name, goal }: { id: string; name: string; goal: string }) {
  const progress = useProgressOf(id);
  const last = progress[progress.length - 1];
  return (
    <Pressable onPress={() => router.push(`/(trainer)/cliente/${id}`)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ flex: 1 }}>
            <Avatar name={name} size={48} />
            <View style={{ flex: 1 }}>
              <Txt variant="subtitle">{name}</Txt>
              <Txt variant="mute">{goal}</Txt>
              {last && <Txt variant="mute" style={{ fontSize: 12, color: colors.accent }}>Último peso · {last.weightKg} kg</Txt>}
            </View>
          </Row>
          <Ionicons name="chevron-forward" size={20} color={colors.mute} />
        </Row>
      </Card>
    </Pressable>
  );
}
