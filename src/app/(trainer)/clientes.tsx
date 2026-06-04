import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Avatar, Badge, Card, EmptyState, Header, Row, Screen, Txt } from '@/components/ui';
import { useClientsOf, useProgressOf, useSession } from '@/lib/db/store';
import type { ClientStatus } from '@/lib/db/types';
import { colors } from '@/lib/theme';

const STATUS_LABEL: Record<ClientStatus, { label: string; tone: 'success' | 'accent' | 'mute' }> = {
  active: { label: 'Activo', tone: 'success' },
  paused: { label: 'Pausado', tone: 'mute' },
  lead: { label: 'Lead', tone: 'accent' },
};

export default function Clientes() {
  const me = useSession();
  const clients = useClientsOf(me?.id ?? '');
  if (!me) return null;

  return (
    <Screen>
      <Header title="Clientes" subtitle={`${clients.length} en total`} right={<Avatar name={me.name} userId={me.id} size={44} />} />
      {clients.length === 0 ? (
        <EmptyState icon="people-outline" text="Aún no tienes clientes." />
      ) : (
        clients.map((c) => (
          <ClientRow key={c.id} id={c.id} name={c.name} goal={c.goal ?? ''} status={c.status ?? 'active'} />
        ))
      )}
    </Screen>
  );
}

function ClientRow({ id, name, goal, status }: { id: string; name: string; goal: string; status: ClientStatus }) {
  const progress = useProgressOf(id);
  const last = progress[progress.length - 1];
  const s = STATUS_LABEL[status];
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
          <Badge label={s.label} tone={s.tone} />
        </Row>
      </Card>
    </Pressable>
  );
}
