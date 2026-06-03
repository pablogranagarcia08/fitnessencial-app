import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Badge, Row, Txt } from '@/components/ui';
import { useStore } from '@/lib/db/store';
import { colors, logo, radius, space } from '@/lib/theme';

export default function Login() {
  const users = useStore((s) => s.db.users);
  const loginAs = useStore((s) => s.loginAs);

  const enter = (id: string, role: 'trainer' | 'client') => {
    loginAs(id);
    router.replace(role === 'trainer' ? '/(trainer)/clientes' : '/(client)/hoy');
  };

  const trainer = users.find((u) => u.role === 'trainer')!;
  const clients = users.filter((u) => u.role === 'client');

  return (
    <SafeAreaView style={st.root}>
      <View style={st.hero}>
        <Image source={logo} style={st.logo} contentFit="contain" />
        <Txt variant="display" style={st.brand}>FITNESSENCIAL</Txt>
        <Txt variant="mute" style={{ letterSpacing: 1 }}>CONTINUE ONE MORE REP</Txt>
      </View>

      <View style={{ gap: space.md }}>
        <Txt variant="label">ENTRAR COMO (demo)</Txt>

        <Pressable onPress={() => enter(trainer.id, 'trainer')} style={({ pressed }) => [st.account, pressed && st.pressed]}>
          <Row style={{ flex: 1 }}>
            <Avatar name={trainer.name} userId={trainer.id} size={48} />
            <View style={{ flex: 1 }}>
              <Txt variant="subtitle">{trainer.name}</Txt>
              <Txt variant="mute">{trainer.goal}</Txt>
            </View>
            <Badge label="Entrenador" tone="accent" />
          </Row>
        </Pressable>

        {clients.map((c) => (
          <Pressable key={c.id} onPress={() => enter(c.id, 'client')} style={({ pressed }) => [st.account, pressed && st.pressed]}>
            <Row style={{ flex: 1 }}>
              <Avatar name={c.name} size={48} />
              <View style={{ flex: 1 }}>
                <Txt variant="subtitle">{c.name}</Txt>
                <Txt variant="mute">{c.goal}</Txt>
              </View>
              <Badge label="Cliente" tone="mute" />
            </Row>
          </Pressable>
        ))}
      </View>

      <Txt variant="mute" style={{ textAlign: 'center', fontSize: 12 }}>
        Versión demo · los datos se guardan en este dispositivo
      </Txt>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: space.lg, justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: 6, marginTop: space.xl },
  logo: { width: 96, height: 96, marginBottom: space.sm },
  brand: { fontSize: 26, letterSpacing: 1 },
  account: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
  },
  pressed: { opacity: 0.7, borderColor: colors.accent },
});
