import Link from "next/link";
import { FileText } from "lucide-react";
import { getCompletedReminders, getNotesByFolder } from "@/lib/db/queries";
import { relativeTimePt } from "@/lib/format";
import { SectionLabel } from "@/components/ui";
import ArchivedTasksList from "@/components/ArchivedTasksList";
import { getCurrentUserId } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function ArquivoPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  const [archivedNotes, completed] = await Promise.all([
    getNotesByFolder(userId, "arquivo"),
    getCompletedReminders(userId),
  ]);

  return (
    <div className="mx-auto max-w-[900px] px-10 py-10">
      <h1 className="text-[26px] font-semibold text-foreground">Arquivo</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Itens arquivados e tarefas concluídas.</p>

      <div className="mt-8">
        <SectionLabel count={archivedNotes.length}>NOTAS ARQUIVADAS</SectionLabel>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-2">
          {archivedNotes.map((n) => (
            <Link key={n.id} href="/notas" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-accent/50">
              <FileText size={13} className="text-muted-foreground" />
              <span className="flex-1 truncate text-[13px] text-foreground">{n.title}</span>
              <span className="text-[11.5px] text-muted-foreground">{relativeTimePt(n.updatedAt)}</span>
            </Link>
          ))}
          {archivedNotes.length === 0 && <p className="px-2.5 py-2 text-[12.5px] text-muted-foreground">Nenhuma nota arquivada.</p>}
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel count={completed.length}>TAREFAS CONCLUÍDAS</SectionLabel>
        <ArchivedTasksList reminders={completed.map((r) => ({ id: r.id, title: r.title }))} />
      </div>
    </div>
  );
}