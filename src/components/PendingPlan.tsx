import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Avatar, Card, Row, Txt } from '@/components/ui';
import { colors, space } from '@/lib/theme';

// Aviso que ve el cliente mientras Kike revisa/prepara su plan (borrador).
export function PendingPlan({ trainerId, trainerName }: { trainerId?: string; trainerName?: string }) {
  return (
    <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xl }}>
      <Avatar name={trainerName ?? 'Kike'} userId={trainerId} size={64} />
      <Ionicons name="time-outline" size={22} color={colors.accent} />
      <Txt variant="subtitle" style={{ textAlign: 'center' }}>
        {trainerName ?? 'Kike'} está preparando tu plan
      </Txt>
      <Txt variant="mute" style={{ textAlign: 'center', maxWidth: 280 }}>
        Está revisando tus datos y ajustando tu entreno y nutrición a medida. Te avisará por el chat en cuanto esté listo.
      </Txt>
    </Card>
  );
}
