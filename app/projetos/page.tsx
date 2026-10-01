import SpaceOverview from "@/components/SpaceOverview";
import { getCurrentUserId } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return (
    <SpaceOverview
      title="Projetos"
      description="Notas e tarefas relacionadas aos projetos em andamento."
      space="projetos"
      noteFolders={["projetos", "drafts"]}
      userId={userId}
    />
  );
}