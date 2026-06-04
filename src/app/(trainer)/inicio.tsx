import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Card, Header, Row, Screen, Txt } from '@/components/ui';
import { useSession, useStore } from '@/lib/db/store';
import { colors, font, radius, space } from '@/lib/theme';

const DAY = 86400000;

export default function Inicio() {
  const me = useSession();
  const db = useStore((s) => s.db);
  if (!me) return null;

  const clients = db.users.filter((u) => u.role === 'client' && u.trainerId === me.id);
  const leads = clients.filter((c) => c.status === 'lead');
  const activos = clients.filter((c) => c.status !== 'lead');

  const hasDraft = (id: string) =>
    db.workoutPlans.some((p) => p.clientId === id && p.status === 'draft') ||
    db.nutritionPlans.some((p) => p.clientId === id && p.status === 'draft');
  const porRevisar = activos.filter((c) => hasDraft(c.id));

  const lastMsgFromClient = (id: string) => {
    const thread = db.messages
      .filter((m) => m.fromId === id || m.toId === id)
      .sort((a, b) => a.createdAt - b.createdAt);
    const last = thread[thread.length - 1];
    return last && last.fromId === id;
  };
  const sinResponder = activos.filter((c) => lastMsgFromClient(c.id));

  const lastProgress = (id: string) =>
    db.progress.filter((p) => p.clientId === id).sort((a, b) => a.date - b.date).at(-1)?.date ?? 0;
  const activos7d = activos.filter((c) => Date.now() - lastProgress(c.id) < 7 * DAY);
  const inactivos = activos.filter((c) => c.status === 'active' && Date.now() - lastProgress(c.id) > 14 * DAY);

  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  // Cola de "necesitan tu atención"
  type Item = { id: string; name: string; tag: string; icon: keyof typeof Ionicons.glyphMap; tone: string; href: string };
  const items: Item[] = [];
  porRevisar.forEach((c) => items.push({ id: 'r' + c.id, name: c.name, tag: 'Plan por revisar', icon: 'document-text', tone: colors.accent, href: `/(trainer)/cliente/${c.id}` }));
  sinResponder.forEach((c) => items.push({ id: 'm' + c.id, name: c.name, tag: 'Te escribió', icon: 'chatbubble-ellipses', tone: colors.warn, href: `/(trainer)/cliente/${c.id}?seg=chat` }));
  leads.forEach((c) => items.push({ id: 'l' + c.id, name: c.name, tag: 'Lead por convertir', icon: 'star', tone: colors.success, href: `/(trainer)/cliente/${c.id}` }));
  inactivos.forEach((c) => items.push({ id: 'i' + c.id, name: c.name, tag: 'Sin actividad +14 días', icon: 'alert-circle', tone: colors.danger, href: `/(trainer)/cliente/${c.id}` }));

  return (
    <Screen>
      <Header title="Hola, Kike" subtitle={hoy[0].toUpperCase() + hoy.slice(1)} right={<Avatar name={me.name} userId={me.id} size={44} />} />

      <Row style={{ gap: space.sm }}>
        <Stat label="Clientes" value={activos.length} icon="people" onPress={() => router.push('/(trainer)/clientes')} />
        <Stat label="Por revisar" value={porRevisar.length} icon="clipboard" tone={porRevisar.length ? colors.accent : undefined} onPress={() => router.push('/(trainer)/revisar')} />
      </Row>
      <Row style={{ gap: space.sm }}>
        <Stat label="Sin responder" value={sinResponder.length} icon="chatbubbles" tone={sinResponder.length ? colors.warn : undefined} onPress={() => router.push('/(trainer)/mensajes')} />
        <Stat label="Activos 7d" value={activos7d.length} icon="flame" />
      </Row>
      {leads.length > 0 && (
        <Row style={{ gap: space.sm }}>
          <Stat label="Leads" value={leads.length} icon="star" tone={colors.success} onPress={() => router.push('/(trainer)/clientes')} />
          <View style={{ flex: 1 }} />
        </Row>
      )}

      <Txt variant="subtitle" style={{ marginTop: space.sm }}>Necesitan tu atención</Txt>
      {items.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 6, paddingVertical: space.lg }}>
          <Ionicons name="checkmark-done-circle" size={30} color={colors.success} />
          <Txt variant="mute">¡Todo al día! No hay nada pendiente.</Txt>
        </Card>
      ) : (
        items.map((it) => (
          <Pressable key={it.id} onPress={() => router.push(it.href as any)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row style={{ flex: 1 }}>
                  <View style={[st.iconWrap, { backgroundColor: it.tone + '22' }]}>
                    <Ionicons name={it.icon} size={18} color={it.tone} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="subtitle" style={{ fontSize: 16 }}>{it.name}</Txt>
                    <Txt variant="mute" style={{ color: it.tone, fontSize: 13 }}>{it.tag}</Txt>
                  </View>
                </Row>
                <Ionicons name="chevron-forward" size={20} color={colors.mute} />
              </Row>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

function Stat({ label, value, icon, tone, onPress }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap; tone?: string; onPress?: () => void }) {
  const c = tone ?? colors.ink;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [st.stat, { opacity: pressed ? 0.7 : 1 }]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Ionicons name={icon} size={18} color={tone ?? colors.mute} />
        {onPress && <Ionicons name="chevron-forward" size={14} color={colors.mute} />}
      </Row>
      <Txt style={{ fontSize: 28, fontWeight: font.display, color: c }}>{value}</Txt>
      <Txt variant="mute" style={{ fontSize: 12 }}>{label}</Txt>
    </Pressable>
  );
}

const st = StyleSheet.create({
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    gap: 2,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
