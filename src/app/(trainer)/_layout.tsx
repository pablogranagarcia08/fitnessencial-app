import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { usePendingClients, useSession } from '@/lib/db/store';
import { colors, font } from '@/lib/theme';

export default function TrainerLayout() {
  const user = useSession();
  const pending = usePendingClients(user?.id ?? '');
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'trainer') return <Redirect href="/(client)/hoy" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mute,
        tabBarStyle: { backgroundColor: colors.bg2, borderTopColor: colors.line, height: 86, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: font.semibold },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="clientes"
        options={{ title: 'Clientes', tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="revisar"
        options={{
          title: 'Revisar',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
          tabBarBadge: pending.length > 0 ? pending.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.bg, fontSize: 11 },
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{ title: 'Mensajes', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} /> }}
      />
      {/* Pantallas fuera de la barra */}
      <Tabs.Screen name="cliente/[id]" options={{ href: null }} />
      <Tabs.Screen name="nuevo-cliente" options={{ href: null }} />
      <Tabs.Screen name="nuevo-recordatorio" options={{ href: null }} />
    </Tabs>
  );
}
