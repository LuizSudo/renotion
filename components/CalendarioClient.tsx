"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Clock, Users, X } from "lucide-react";
import type { getEvents, getReminders } from "@/lib/db/queries";
import { createEvent, createReminder, toggleReminderDone } from "@/lib/db/actions";
import { Checkbox } from "@/components/ui";

type EventRow = Awaited<ReturnType<typeof getEvents>>[number];
type Reminder = Awaited<ReturnType<typeof getReminders>>[number];

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }
  return cells;
}

export default function CalendarioClient({ events, reminders }: { events: EventRow[]; reminders: Reminder[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<Date>(today);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of events) {
      map.set(ev.date, [...(map.get(ev.date) ?? []), ev]);
    }
    return map;
  }, [events]);

  const remindersByDay = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    for (const r of reminders) {
      if (!r.dueDate) continue;
      map.set(r.dueDate, [...(map.get(r.dueDate) ?? []), r]);
    }
    return map;
  }, [reminders]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  function goMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToday() {
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
    setSelected(today);
  }

  const selectedISO = toISO(selected);
  const selectedEvents = eventsByDay.get(selectedISO) ?? [];
  const selectedTasks = remindersByDay.get(selectedISO) ?? [];

  const selectedLabel = selected.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  async function handleCreateEvent() {
    if (!newEventTitle.trim()) return;
    await createEvent({ title: newEventTitle, date: selectedISO, timeLabel: newEventTime || null });
    setNewEventTitle("");
    setNewEventTime("");
    setShowNewEvent(false);
    refresh();
  }

  async function handleCreateTask() {
    if (!newTaskTitle.trim()) return;
    await createReminder({ title: newTaskTitle, dueDate: selectedISO, space: "projetos" });
    setNewTaskTitle("");
    refresh();
  }

  async function handleToggleTask(id: string) {
    await toggleReminderDone(id);
    refresh();
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[16px] font-semibold text-foreground">
              {MONTH_NAMES[cursor.month]} de {cursor.year}
            </h1>
            <div className="flex items-center gap-1">
              <button onClick={() => goMonth(-1)} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => goMonth(1)} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                <ChevronRight size={16} />
              </button>
            </div>
            <button onClick={goToday} className="rounded-md border border-border px-2.5 py-1 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground">
              Hoje
            </button>
          </div>
          <button
            onClick={() => setShowNewEvent((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={14} />
            Adicionar Evento
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-border text-center text-[11px] font-semibold tracking-wide text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-7 grid-rows-6">
          {cells.map(({ date, inMonth }, i) => {
            const iso = toISO(date);
            const dayEvents = eventsByDay.get(iso) ?? [];
            const isSelected = iso === selectedISO;
            const isToday = iso === toISO(today);
            return (
              <button
                key={i}
                onClick={() => setSelected(date)}
                className={`
                  flex flex-col items-start gap-1 border-b border-r border-border p-2 text-left transition-colors hover:bg-accent
                  ${isSelected ? "ring-1 ring-inset ring-primary" : ""}
                `}
              >
                <span
                  className={`
                    flex h-5 w-5 items-center justify-center rounded-full text-[12.5px]
                    ${isToday ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  {date.getDate()}
                </span>
                <div className="flex w-full flex-col gap-1">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={`
                        truncate rounded px-1.5 py-0.5 text-left text-[10.5px] leading-tight
                        ${ev.variant === "dark" ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}
                      `}
                    >
                      {ev.title}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      <div className="hidden w-[300px] shrink-0 flex-col border-l border-border px-5 py-5 lg:flex">
        <h2 className="text-[15px] font-semibold capitalize text-foreground">{selectedLabel}</h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          {selectedEvents.length} evento{selectedEvents.length === 1 ? "" : "s"} agendado{selectedEvents.length === 1 ? "" : "s"}
        </p>

        <div className="mb-2 mt-6 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground">EVENTOS</h3>
          <button onClick={() => setShowNewEvent((v) => !v)} className="text-[11.5px] text-muted-foreground hover:text-foreground">
            + Novo
          </button>
        </div>

        {showNewEvent && (
          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border p-2.5 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Novo evento</span>
              <button onClick={() => setShowNewEvent(false)}>
                <X size={13} className="text-muted-foreground" />
              </button>
            </div>
            <input
              autoFocus
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Título do evento"
              className="rounded-md border border-border bg-input px-2 py-1 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
              placeholder="Horário (ex: 10h00 – 11h00)"
              className="rounded-md border border-border bg-input px-2 py-1 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleCreateEvent}
              className="rounded-md bg-primary py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Adicionar em {selected.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {selectedEvents.length ? (
            selectedEvents.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-border p-3 bg-card">
                <p className="text-[13px] font-medium text-foreground">{ev.title}</p>
                {ev.timeLabel && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Clock size={11} /> {ev.timeLabel}
                  </p>
                )}
                {!!ev.attendees && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Users size={11} /> {ev.attendees} participantes
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-[12.5px] text-muted-foreground">Nenhum evento neste dia.</p>
          )}
        </div>

        <h3 className="mb-2 mt-6 text-[11px] font-semibold tracking-wide text-muted-foreground">TAREFAS</h3>
        <div className="flex flex-col gap-2">
          {selectedTasks.map((t) => (
            <label key={t.id} className="flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-accent">
              <Checkbox checked={t.done} onChange={() => handleToggleTask(t.id)} />
              <span className={`flex-1 text-[13px] ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {t.title}
              </span>
            </label>
          ))}
          {selectedTasks.length === 0 && <p className="text-[12.5px] text-muted-foreground">Nenhuma tarefa para este dia.</p>}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
            placeholder="+ Nova tarefa neste dia"
            className="flex-1 rounded-md border border-border bg-input px-1 py-1 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}