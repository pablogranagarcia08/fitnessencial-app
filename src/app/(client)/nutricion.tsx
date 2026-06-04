import { NutritionView } from '@/components/features/NutritionView';
import { PendingPlan } from '@/components/PendingPlan';
import { Header, Screen } from '@/components/ui';
import { useNutritionPlan, useSession, useUser } from '@/lib/db/store';

export default function Nutricion() {
  const me = useSession();
  const plan = useNutritionPlan(me?.id);
  const trainer = useUser(me?.trainerId);
  if (!me) return null;

  const pending = plan?.status === 'draft';
  return (
    <Screen>
      <Header title="Nutrición" subtitle={pending ? 'En preparación' : 'Tu plan de alimentación'} />
      {pending ? (
        <PendingPlan trainerId={trainer?.id} trainerName={trainer?.name} />
      ) : (
        <NutritionView clientId={me.id} mode="client" />
      )}
    </Screen>
  );
}
