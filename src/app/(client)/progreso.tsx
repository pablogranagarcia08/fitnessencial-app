import { ProgressView } from '@/components/features/ProgressView';
import { Header, Screen } from '@/components/ui';
import { useSession } from '@/lib/db/store';

export default function Progreso() {
  const me = useSession();
  if (!me) return null;
  return (
    <Screen>
      <Header title="Tu progreso" subtitle="Peso, medidas y fotos" />
      <ProgressView clientId={me.id} mode="client" />
    </Screen>
  );
}
