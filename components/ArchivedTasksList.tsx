"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleReminderDone } from "@/lib/db/actions";
import { Checkbox } from "@/components/ui";

export default function ArchivedTasksList({ reminders }: { reminders: { id: string; title: string }[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function restore(id: string) {
    await toggleReminderDone(id);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-2">
      {reminders.map((r) => (
        <div key={r.id} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-accent/50">
          <Checkbox checked={true} onChange={() => restore(r.id)} />
          <span className="flex-1 truncate text-[13px] text-muted-foreground line-through">{r.title}</span>
        </div>
      ))}
      {reminders.length === 0 && <p className="px-2.5 py-2 text-[12.5px] text-muted-foreground">Nenhuma tarefa concluída ainda.</p>}
    </div>
  );
}