import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatView } from '@/components/features/ChatView';
import { Avatar, Header } from '@/components/ui';
import { useSession, useUser } from '@/lib/db/store';
import { colors, space } from '@/lib/theme';

export default function Chat() {
  const me = useSession();
  const trainer = useUser(me?.trainerId);
  if (!me || !trainer) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: space.lg, paddingBottom: space.sm }}>
        <Header title={trainer.name} subtitle="Tu entrenador" right={<Avatar name={trainer.name} userId={trainer.id} size={44} />} />
      </View>
      <ChatView meId={me.id} otherId={trainer.id} coachId={trainer.id} />
    </SafeAreaView>
  );
}
