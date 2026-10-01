import SpaceOverview from "@/components/SpaceOverview";
import { getCurrentUserId } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function PessoalPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return (
    <SpaceOverview
      title="Pessoal"
      description="Suas notas pessoais e tarefas fora do trabalho."
      space="pessoal"
      noteFolders={["pessoal"]}
      userId={userId}
    />
  );
}