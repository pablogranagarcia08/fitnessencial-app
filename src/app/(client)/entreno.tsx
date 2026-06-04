import { WorkoutView } from '@/components/features/WorkoutView';
import { PendingPlan } from '@/components/PendingPlan';
import { Header, Screen } from '@/components/ui';
import { useSession, useUser, useWorkoutPlan } from '@/lib/db/store';

export default function Entreno() {
  const me = useSession();
  const plan = useWorkoutPlan(me?.id);
  const trainer = useUser(me?.trainerId);
  if (!me) return null;

  const pending = plan?.status === 'draft';
  return (
    <Screen>
      <Header title="Tu entreno" subtitle={pending ? 'En preparación' : 'Marca cada ejercicio al terminarlo'} />
      {pending ? (
        <PendingPlan trainerId={trainer?.id} trainerName={trainer?.name} />
      ) : (
        <WorkoutView clientId={me.id} mode="client" />
      )}
    </Screen>
  );
}
