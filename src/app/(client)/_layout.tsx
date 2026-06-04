import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useSession } from '@/lib/db/store';
import { colors, font } from '@/lib/theme';

export default function ClientLayout() {
  const user = useSession();
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'client') return <Redirect href="/(trainer)/inicio" />;

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
      <Tabs.Screen name="hoy" options={{ title: 'Hoy', tabBarIcon: ({ color, size }) => <Ionicons name="today" size={size} color={color} /> }} />
      <Tabs.Screen name="entreno" options={{ title: 'Entreno', tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} /> }} />
      <Tabs.Screen name="nutricion" options={{ title: 'Nutrición', tabBarIcon: ({ color, size }) => <Ionicons name="nutrition" size={size} color={color} /> }} />
      <Tabs.Screen name="progreso" options={{ title: 'Progreso', tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} /> }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
    </Tabs>
  );
}
