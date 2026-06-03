import { NutritionView } from '@/components/features/NutritionView';
import { Header, Screen } from '@/components/ui';
import { useSession } from '@/lib/db/store';

export default function Nutricion() {
  const me = useSession();
  if (!me) return null;
  return (
    <Screen>
      <Header title="Nutrición" subtitle="Tu plan de alimentación" />
      <NutritionView clientId={me.id} mode="client" />
    </Screen>
  );
}
