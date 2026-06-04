import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Avatar, Badge, Card, EmptyState, Header, Row, Screen, Txt } from '@/components/ui';
import { usePendingClients, useSession } from '@/lib/db/store';
import { colors } from '@/lib/theme';

export default function Revisar() {
  const me = useSession();
  const pending = usePendingClients(me?.id ?? '');
  if (!me) return null;

  return (
    <Screen>
      <Header title="Revisar planes" subtitle={pending.length ? `${pending.length} pendiente(s) de enviar` : 'Bandeja de revisión'} />
      {pending.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" text="No hay planes pendientes. Cuando un cliente pida su plan, aparecerá aquí para que lo revises y lo envíes." />
      ) : (
        pending.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/(trainer)/cliente/${c.id}`)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row style={{ flex: 1 }}>
                  <Avatar name={c.name} size={48} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="subtitle">{c.name}</Txt>
                    <Txt variant="mute">{c.goal}</Txt>
                  </View>
                </Row>
                <Badge label="Por revisar" tone="accent" />
              </Row>
              <Row style={{ gap: 6 }}>
                <Ionicons name="document-text-outline" size={16} color={colors.mute} />
                <Txt variant="mute" style={{ fontSize: 13 }}>Plan a medida listo para revisar y enviar</Txt>
              </Row>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
