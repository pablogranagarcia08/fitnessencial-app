import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Avatar, Card, EmptyState, Header, Row, Screen, Txt } from '@/components/ui';
import { useClientsOf, useSession, useStore } from '@/lib/db/store';
import { colors } from '@/lib/theme';

export default function Mensajes() {
  const me = useSession();
  const clients = useClientsOf(me?.id ?? '');
  const messages = useStore((s) => s.db.messages);
  if (!me) return null;

  return (
    <Screen>
      <Header title="Mensajes" />
      {clients.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" text="Sin conversaciones." />
      ) : (
        clients.map((c) => {
          const thread = messages
            .filter((m) => (m.fromId === c.id && m.toId === me.id) || (m.fromId === me.id && m.toId === c.id))
            .sort((a, b) => a.createdAt - b.createdAt);
          const last = thread[thread.length - 1];
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/(trainer)/cliente/${c.id}?seg=chat`)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Card>
                <Row style={{ flex: 1 }}>
                  <Avatar name={c.name} size={48} />
                  <View style={{ flex: 1 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Txt variant="subtitle">{c.name}</Txt>
                      {last && (
                        <Txt variant="mute" style={{ fontSize: 11 }}>
                          {new Date(last.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </Txt>
                      )}
                    </Row>
                    <Txt variant="mute" numberOfLines={1}>
                      {last ? `${last.fromId === me.id ? 'Tú: ' : ''}${last.text}` : 'Sin mensajes'}
                    </Txt>
                  </View>
                </Row>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
