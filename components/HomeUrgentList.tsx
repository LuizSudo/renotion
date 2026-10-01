"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleReminderDone } from "@/lib/db/actions";
import { Checkbox } from "@/components/ui";

export default function HomeUrgentList({
  reminders,
}: {
  reminders: { id: string; title: string; done: boolean }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function handleToggle(id: string) {
    await toggleReminderDone(id);
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-lg border border-border p-4 bg-card">
      <div className="flex flex-col gap-3">
        {reminders.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <Checkbox checked={r.done} onChange={() => handleToggle(r.id)} />
            <span className={`text-[13px] ${r.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {r.title}
            </span>
          </div>
        ))}
        {reminders.length === 0 && <p className="text-[12.5px] text-muted-foreground">Nenhum lembrete urgente 🎉</p>}
      </div>
      <Link
        href="/lembretes"
        className="mt-4 flex w-full items-center justify-center rounded-md bg-primary py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
      >
        Ver Todas as Tarefas
      </Link>
    </div>
  );
}