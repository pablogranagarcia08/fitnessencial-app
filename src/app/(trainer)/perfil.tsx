import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, View } from 'react-native';
import { Avatar, Button, Card, Header, Row, Screen, Txt } from '@/components/ui';
import { useClientsOf, useSession, useStore } from '@/lib/db/store';
import { colors, logo, space } from '@/lib/theme';

export default function Perfil() {
  const me = useSession();
  const clients = useClientsOf(me?.id ?? '');
  const logout = useStore((s) => s.logout);
  const resetDemo = useStore((s) => s.resetDemo);
  if (!me) return null;

  const doLogout = () => {
    logout();
    router.replace('/login');
  };

  const doReset = () => {
    Alert.alert('Reiniciar demo', 'Esto borra los cambios y vuelve a los datos de ejemplo. ¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: () => {
          resetDemo();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header title="Perfil" />
      <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.lg }}>
        <Avatar name={me.name} userId={me.id} size={96} />
        <Txt variant="title">{me.name}</Txt>
        <Txt variant="mute">{me.email}</Txt>
        <Row style={{ marginTop: space.sm, gap: space.lg }}>
          <Stat n={clients.length} label="Clientes" />
        </Row>
      </Card>

      <Card style={{ alignItems: 'center', gap: 6 }}>
        <Image source={logo} style={{ width: 54, height: 54 }} contentFit="contain" />
        <Txt variant="subtitle" style={{ letterSpacing: 1 }}>FITNESSENCIAL</Txt>
        <Txt variant="mute" style={{ fontSize: 12 }}>Versión demo · datos locales en este dispositivo</Txt>
      </Card>

      <View style={{ gap: space.sm, marginTop: space.sm }}>
        <Button title="Reiniciar demo" variant="ghost" icon="refresh" onPress={doReset} />
        <Button title="Cerrar sesión" variant="danger" icon="log-out-outline" onPress={doLogout} />
      </View>
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt variant="title" style={{ color: colors.accent }}>{n}</Txt>
      <Txt variant="mute">{label}</Txt>
    </View>
  );
}
