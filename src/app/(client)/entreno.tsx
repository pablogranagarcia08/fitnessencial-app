import { WorkoutView } from '@/components/features/WorkoutView';
import { Header, Screen } from '@/components/ui';
import { useSession } from '@/lib/db/store';

export default function Entreno() {
  const me = useSession();
  if (!me) return null;
  return (
    <Screen>
      <Header title="Tu entreno" subtitle="Marca cada ejercicio al terminarlo" />
      <WorkoutView clientId={me.id} mode="client" />
    </Screen>
  );
}
