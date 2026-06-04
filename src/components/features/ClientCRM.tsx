import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Avatar, Button, Card, Row, SectionTitle, Txt } from '@/components/ui';
import { useProgressOf, useStore, useUser, useWorkoutPlan } from '@/lib/db/store';
import type { ClientStatus } from '@/lib/db/types';
import { colors, font, radius, space } from '@/lib/theme';

const STATUS: { k: ClientStatus; label: string; tone: string }[] = [
  { k: 'active', label: 'Activo', tone: colors.success },
  { k: 'paused', label: 'Pausado', tone: colors.warn },
  { k: 'lead', label: 'Lead', tone: colors.accent },
];

export function ClientCRM({
  clientId,
  pending,
  onMessage,
  onRegenerate,
  onSend,
}: {
  clientId: string;
  pending: boolean;
  onMessage: () => void;
  onRegenerate: () => void;
  onSend: () => void;
}) {
  const client = useUser(clientId);
  const plan = useWorkoutPlan(clientId);
  const progress = useProgressOf(clientId);
  const updateUser = useStore((s) => s.updateUser);
  if (!client) return null;

  const status = client.status ?? 'active';
  const last = progress[progress.length - 1]?.weightKg;
  const first = progress[0]?.weightKg;
  const delta = last != null && first != null ? last - first : null;
  const planLabel = !plan ? 'Sin plan' : plan.status === 'draft' ? 'Borrador' : 'Activo';

  return (
    <View style={{ gap: space.md }}>
      <Card style={{ gap: space.md }}>
        <Row>
          <Avatar name={client.name} size={56} />
          <View style={{ flex: 1 }}>
            <Txt variant="title" style={{ fontSize: 20 }}>{client.name}</Txt>
            <Txt variant="mute">{client.goal}</Txt>
          </View>
        </Row>

        <View style={{ gap: 6 }}>
          <Txt variant="label">ESTADO</Txt>
          <Row style={{ gap: 8 }}>
            {STATUS.map((s) => {
              const active = s.k === status;
              return (
                <Pressable key={s.k} onPress={() => updateUser(client.id, { status: s.k })} style={[st.chip, active && { backgroundColor: s.tone + '22', borderColor: s.tone }]}>
                  <Txt style={{ color: active ? s.tone : colors.inkSoft, fontWeight: font.semibold, fontSize: 13 }}>{s.label}</Txt>
                </Pressable>
              );
            })}
          </Row>
        </View>
      </Card>

      <Row style={{ gap: space.sm }}>
        <Mini label="Último peso" value={last != null ? `${last} kg` : '—'} sub={delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg` : undefined} subTone={delta != null ? (delta <= 0 ? colors.success : colors.warn) : undefined} />
        <Mini label="Plan" value={planLabel} valueTone={plan?.status === 'draft' ? colors.accent : undefined} />
        <Mini label="Cliente desde" value={client.since ? new Date(client.since).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }) : '—'} />
      </Row>

      <Card style={{ gap: 8 }}>
        <SectionTitle>Contacto</SectionTitle>
        <Row style={{ gap: 8 }}><Ionicons name="mail-outline" size={16} color={colors.mute} /><Txt variant="body" style={{ color: colors.ink }}>{client.email}</Txt></Row>
        {client.phone ? <Row style={{ gap: 8 }}><Ionicons name="call-outline" size={16} color={colors.mute} /><Txt variant="body" style={{ color: colors.ink }}>{client.phone}</Txt></Row> : null}
      </Card>

      <Card style={{ gap: 8 }}>
        <Row style={{ gap: 6 }}>
          <Ionicons name="lock-closed-outline" size={15} color={colors.mute} />
          <Txt variant="label">NOTAS PRIVADAS</Txt>
        </Row>
        <TextInput
          value={client.notes ?? ''}
          onChangeText={(t) => updateUser(client.id, { notes: t })}
          placeholder="Anota lo que quieras de este cliente (lesiones, preferencias, recordatorios…)"
          placeholderTextColor={colors.mute}
          multiline
          style={st.notes}
        />
        <Txt variant="mute" style={{ fontSize: 11 }}>Solo las ves tú.</Txt>
      </Card>

      <View style={{ gap: space.sm }}>
        {pending && <Button title="Enviar plan al cliente" icon="paper-plane" onPress={onSend} />}
        <Row style={{ gap: space.sm }}>
          <Button title="Mensaje" variant="ghost" icon="chatbubble-ellipses" small onPress={onMessage} style={{ flex: 1 }} />
          <Button title="Rehacer plan" variant="ghost" icon="refresh" small onPress={onRegenerate} style={{ flex: 1 }} />
        </Row>
      </View>
    </View>
  );
}

function Mini({ label, value, sub, subTone, valueTone }: { label: string; value: string; sub?: string; subTone?: string; valueTone?: string }) {
  return (
    <View style={st.mini}>
      <Txt variant="mute" style={{ fontSize: 11 }}>{label}</Txt>
      <Txt style={{ fontSize: 16, fontWeight: font.bold, color: valueTone ?? colors.ink }}>{value}</Txt>
      {sub ? <Txt style={{ fontSize: 12, color: subTone ?? colors.mute, fontWeight: font.semibold }}>{sub}</Txt> : null}
    </View>
  );
}

const st = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg2 },
  mini: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: space.md, gap: 2 },
  notes: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    color: colors.ink,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
