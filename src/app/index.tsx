import { Redirect } from 'expo-router';
import { useSession } from '@/lib/db/store';

// Punto de entrada: redirige según la sesión y el rol.
export default function Index() {
  const user = useSession();
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={user.role === 'trainer' ? '/(trainer)/inicio' : '/(client)/hoy'} />;
}
