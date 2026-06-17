import { PlanningView } from '@/components/features/PlanningView';
import { Header, Screen } from '@/components/ui';
import { useSession } from '@/lib/db/store';

export default function Plan() {
  const me = useSession();
  if (!me) return null;
  return (
    <Screen>
      <Header title="Mi planificación" subtitle="Tu calendario semana a semana" />
      <PlanningView clientId={me.id} mode="client" />
    </Screen>
  );
}
