import Link from "next/link";
import { FileText } from "lucide-react";
import { getNotesByFolder, getRemindersBySpace } from "@/lib/db/queries";
import { relativeTimePt } from "@/lib/format";
import { SectionLabel } from "@/components/ui";
import SpaceTasksList from "@/components/SpaceTasksList";
import type { Note, Reminder } from "@/lib/types";

export default async function SpaceOverview({
  title,
  description,
  space,
  noteFolders,
  userId,
}: {
  title: string;
  description: string;
  space: Reminder["space"];
  noteFolders: Note["folder"][];
  userId: string;
}) {
  const [spaceNotes, spaceReminders] = await Promise.all([
    getNotesByFolder(userId, noteFolders),
    getRemindersBySpace(userId, space),
  ]);
  const openTasks = spaceReminders.filter((r) => !r.done);

  return (
    <div className="mx-auto max-w-[900px] px-10 py-10">
      <h1 className="text-[26px] font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <SectionLabel count={spaceNotes.length}>NOTAS</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {spaceNotes.map((n) => (
              <Link
                key={n.id}
                href="/notas"
                className="flex flex-col gap-1.5 rounded-lg border border-border p-3.5 transition-colors hover:border-ring/50 hover:bg-accent/50"
              >
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-muted-foreground" />
                  <p className="truncate text-[13px] font-medium text-foreground">{n.title}</p>
                </div>
                <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                  {n.content.slice(0, 140) || "Nota em branco."}
                </p>
                <p className="text-[11px] text-muted-foreground">{relativeTimePt(n.updatedAt)}</p>
              </Link>
            ))}
            {spaceNotes.length === 0 && <p className="text-[12.5px] text-muted-foreground">Nenhuma nota neste espaço ainda.</p>}
          </div>
        </section>

        <section>
          <SectionLabel count={openTasks.length}>TAREFAS ABERTAS</SectionLabel>
          <SpaceTasksList reminders={openTasks} space={space} />
        </section>
      </div>
    </div>
  );
}