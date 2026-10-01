"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReminder, toggleReminderDone } from "@/lib/db/actions";
import { Checkbox, PriorityBadge } from "@/components/ui";

export default function SpaceTasksList({
  reminders,
  space,
}: {
  reminders: { id: string; title: string; done: boolean; priority: string | null }[];
  space: "projetos" | "pessoal" | "arquivo";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function toggle(id: string) {
    await toggleReminderDone(id);
    refresh();
  }

  async function addTask() {
    if (!newTitle.trim()) return;
    await createReminder({ title: newTitle, space });
    setNewTitle("");
    refresh();
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-2">
      {reminders.map((r) => (
        <div key={r.id} className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-accent/50">
          <Checkbox checked={r.done} onChange={() => toggle(r.id)} />
          <span className="flex-1 truncate text-[13px] text-foreground">{r.title}</span>
          {r.priority && <PriorityBadge priority={r.priority as "HIGH" | "MED" | "LOW"} />}
        </div>
      ))}
      {reminders.length === 0 && <p className="px-2 py-2 text-[12.5px] text-muted-foreground">Nenhuma tarefa aberta.</p>}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="+ Nova tarefa"
          className="flex-1 text-[13px] text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}