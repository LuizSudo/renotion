"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import type { getEventsByDate, getTodayReminders } from "@/lib/db/queries";
import { createReminder, toggleReminderDone } from "@/lib/db/actions";
import { Checkbox, PriorityBadge, SectionLabel } from "@/components/ui";

type Reminder = Awaited<ReturnType<typeof getTodayReminders>>[number];
type EventRow = Awaited<ReturnType<typeof getEventsByDate>>[number];

export default function HojeClient({
  reminders,
  events,
  dateLabel,
}: {
  reminders: Reminder[];
  events: EventRow[];
  dateLabel: string;
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
    await createReminder({ title: newTitle, dueDate: new Date().toISOString().slice(0, 10), space: "projetos" });
    setNewTitle("");
    refresh();
  }

  const doneCount = reminders.filter((r) => r.done).length;

  return (
    <div className="mx-auto max-w-[760px] px-10 py-10">
      <h1 className="text-[26px] font-semibold text-foreground">Hoje</h1>
      <p className="mt-1 text-[13px] capitalize text-muted-foreground">{dateLabel}</p>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-[1fr_220px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>TAREFAS DE HOJE</SectionLabel>
            <span className="text-[12px] text-muted-foreground">
              {doneCount}/{reminders.length} concluídas
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border p-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-md px-2.5 py-2.5 hover:bg-accent">
                <Checkbox checked={r.done} onChange={() => toggle(r.id)} />
                <span className={`flex-1 text-[13.5px] ${r.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {r.title}
                </span>
                {r.timeLabel && <span className="text-[12px] text-muted-foreground">{r.timeLabel}</span>}
                {r.priority && <PriorityBadge priority={r.priority as "HIGH" | "MED" | "LOW"} />}
              </div>
            ))}
            {reminders.length === 0 && <p className="px-2.5 py-3 text-[12.5px] text-muted-foreground">Nada para hoje. Aproveite 🎉</p>}
            <div className="flex items-center gap-2 px-2.5 py-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="+ Adicionar tarefa para hoje"
                className="flex-1 text-[13px] text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </section>

        <section>
          <SectionLabel>AGENDA</SectionLabel>
          <div className="flex flex-col gap-3">
            {events.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-border p-3">
                <p className="text-[13px] font-medium text-foreground">{ev.title}</p>
                {ev.timeLabel && (
                  <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <Clock size={11} /> {ev.timeLabel}
                  </p>
                )}
              </div>
            ))}
            {events.length === 0 && <p className="text-[12.5px] text-muted-foreground">Nenhum evento hoje.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}