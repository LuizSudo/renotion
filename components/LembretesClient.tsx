"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, Plus, Search, Trash2, X, CalendarDays, Wifi } from "lucide-react";
import type { getReminders } from "@/lib/db/queries";
import {
  addSubtask,
  createReminder,
  deleteReminder,
  toggleReminderDone,
  toggleSubtaskDone,
  updateReminder,
} from "@/lib/db/actions";
import { Checkbox, PriorityBadge, SectionLabel } from "@/components/ui";
import { useReminderUpdates } from "@/lib/realtime";

type Reminder = Awaited<ReturnType<typeof getReminders>>[number];
type Group = Reminder["group"];

const groupLabels: Record<Group, string> = {
  overdue: "OVERDUE",
  hoje: "HOJE",
  proximos: "PRÓXIMOS",
  completed: "COMPLETED",
};

const groupOrder: Group[] = ["overdue", "hoje", "proximos", "completed"];

function formatDatePt(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

export default function LembretesClient({ reminders }: { reminders: Reminder[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(reminders[0]?.id ?? null);
  const [filter, setFilter] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const selected = reminders.find((r) => r.id === selectedId) ?? null;

  // Real-time updates
  const remoteUpdate = useReminderUpdates(selectedId);
  
  // Derived state instead of useEffect with setState
  const showRemoteUpdate = Boolean(remoteUpdate && selected && remoteUpdate.done !== selected.done);

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = q ? reminders.filter((r) => r.title.toLowerCase().includes(q)) : reminders;
    return groupOrder.map((g) => ({ group: g, items: filtered.filter((r) => r.group === g) }));
  }, [reminders, filter]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleToggleDone(id: string) {
    await toggleReminderDone(id);
    refresh();
  }

  async function handleToggleSubtask(id: string) {
    await toggleSubtaskDone(id);
    refresh();
  }

  async function handleAddSubtask() {
    if (!selected || !newSubtaskTitle.trim()) return;
    await addSubtask(selected.id, newSubtaskTitle);
    setNewSubtaskTitle("");
    refresh();
  }

  async function handleCreateTask() {
    if (!newTaskTitle.trim()) return;
    const id = await createReminder({ title: newTaskTitle, space: "projetos" });
    setNewTaskTitle("");
    setShowNewTask(false);
    refresh();
    if (id) setSelectedId(id);
  }

  async function handleDelete(id: string) {
    await deleteReminder(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  }

  async function handlePriorityChange(id: string, priority: string) {
    await updateReminder(id, { priority });
    refresh();
  }

  async function handleAcceptRemote() {
    if (!selected || !remoteUpdate) return;
    await toggleReminderDone(selected.id);
    refresh();
  }

  async function handleDismissRemote() {
    // Since showRemoteUpdate is derived state, we just need to trigger a refresh
    // to re-evaluate the condition. In practice, the remote update will be 
    // "accepted" by the server action, so it won't show again.
    refresh();
  }

  return (
    <div className="flex h-full">
      {/* List column */}
      <div className="flex w-full min-w-0 flex-1 flex-col border-r border-border lg:max-w-[560px]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="text-[17px] font-semibold text-foreground">Lembretes</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-muted-foreground">
              <Search size={13} />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar lembretes..."
                className="w-40 bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowNewTask((v) => !v)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={14} />
              Nova Tarefa
            </button>
          </div>
        </div>

        {showNewTask && (
          <div className="flex items-center gap-2 border-b border-border px-6 py-3">
            <input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
              placeholder="Título da nova tarefa..."
              className="flex-1 rounded-md border border-border bg-input px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleCreateTask}
              className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Adicionar
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {grouped.map(({ group, items }) =>
            items.length ? (
              <div key={group} className="mb-6">
                <SectionLabel count={group !== "completed" ? items.length : undefined}>
                  {groupLabels[group]}
                </SectionLabel>
                <div className="flex flex-col gap-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors cursor-pointer
                        ${selectedId === item.id ? "bg-accent" : "hover:bg-accent/50"}
                      `}
                    >
                      <Checkbox checked={item.done} onChange={() => handleToggleDone(item.id)} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[13.5px] ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}
                        >
                          {item.title}
                        </p>
                        {(item.dueDate || item.timeLabel || item.priority) && (
                          <div className="mt-0.5 flex items-center gap-2">
                            {item.dueDate && (
                              <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                                <Calendar size={11} /> {formatDatePt(item.dueDate)}
                              </span>
                            )}
                            {item.timeLabel && (
                              <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                                <CalendarDays size={11} /> {item.timeLabel}
                              </span>
                            )}
                            {item.priority && <PriorityBadge priority={item.priority as "HIGH" | "MED" | "LOW"} />}
                          </div>
                        )}
                      </div>
                      {group !== "completed" && (
                        <ChevronRight
                          size={15}
                          className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
          {reminders.length === 0 && (
            <p className="px-1 py-4 text-[13px] text-muted-foreground">Nenhum lembrete ainda. Crie o primeiro acima.</p>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="hidden flex-1 flex-col bg-accent/30 lg:flex">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
              <Checkbox checked={selected.done} onChange={() => handleToggleDone(selected.id)} size={16} />
              <div className="flex items-center gap-1 text-muted-foreground">
                {showRemoteUpdate && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                    <Wifi className="text-amber-500" size={14} />
                    <span className="text-amber-400">
                      {remoteUpdate?.done ? "Marcado como concluído" : "Marcado como pendente"} remotamente
                    </span>
                    <button onClick={handleAcceptRemote} className="text-xs text-amber-400 hover:underline">Aceitar</button>
                    <button onClick={handleDismissRemote} className="text-xs text-amber-400 hover:underline">Ignorar</button>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="rounded-md p-1.5 hover:bg-accent hover:text-red-500"
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setSelectedId(null)} className="rounded-md p-1.5 hover:bg-accent hover:text-foreground">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h2 className="text-[20px] font-semibold leading-snug text-foreground">{selected.title}</h2>

              <div className="mt-5 flex flex-col gap-3 text-[13px]">
                <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">DATA DE VENCIMENTO</span>
                  <span className="flex w-fit items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-foreground">
                    <Calendar size={12} /> {formatDatePt(selected.dueDate) ?? "Sem data"}
                  </span>
                </div>
                <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">PRIORIDADE</span>
                  <div className="flex gap-1.5">
                    {(["LOW", "MED", "HIGH"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePriorityChange(selected.id, p)}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors
                          ${selected.priority === p ? "bg-primary text-primary-foreground" : "bg-accent text-foreground hover:bg-accent/80"}
                        `}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">CRIADO POR</span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="h-5 w-5 rounded-full bg-muted" />
                    {selected.user?.name || "Você"}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <SectionLabel>DESCRIÇÃO</SectionLabel>
                <textarea
                  defaultValue={selected.description ?? ""}
                  placeholder="Adicione uma descrição..."
                  onBlur={(e) => updateReminder(selected.id, { description: e.target.value }).then(refresh)}
                  className="min-h-[90px] w-full resize-none rounded-lg border border-border bg-card p-3.5 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <SectionLabel>SUBTAREFAS</SectionLabel>
                  {selected.subtasks.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      {selected.subtasks.filter((s) => s.done).length}/{selected.subtasks.length} Concluído
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {selected.subtasks.map((s) => (
                    <label key={s.id} className="flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-accent/50">
                      <Checkbox checked={s.done} onChange={() => handleToggleSubtask(s.id)} />
                      <span className={`text-[13px] ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {s.title}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                    placeholder="+ Adicionar subtarefa"
                    className="flex-1 rounded-md border border-border bg-input px-1 py-1 text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            Selecione um lembrete para ver os detalhes
          </div>
        )}
      </div>
    </div>
  );
}