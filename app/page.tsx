import { Suspense } from 'react';
import Link from "next/link";
import { Image as ImageIcon, ListChecks, Quote, Code2 } from "lucide-react";
import { getUpcomingEvents, getUrgentReminders, getRecentNotes } from "@/lib/db/queries";
import { relativeTimePt } from "@/lib/format";
import { getCurrentUser } from "@/lib/server-auth";
import HomeUrgentList from "@/components/HomeUrgentList";
import { PageSkeleton } from "@/components/PageSkeleton";

export const dynamic = "force-dynamic";

const coverIcon = { image: ImageIcon, checklist: ListChecks, quote: Quote, code: Code2 } as const;
const coverLabel = {
  image: "Cover Image Placeholder",
  checklist: "Checklist Preview",
  quote: "Reading Journal",
  code: "Code Snippets",
} as const;

function formatEventDay(iso: string) {
  const [, m, d] = iso.split("-");
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return { day: d, month: months[Number(m) - 1] };
}

async function UpcomingEvents({ userId }: { userId: string }) {
  const upcomingEvents = await getUpcomingEvents(userId, 3);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-foreground">Próximos Eventos</h2>
        <Link href="/calendario" className="text-[12px] text-muted-foreground hover:text-foreground">
          Ver Calendário
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {upcomingEvents.map((ev) => {
          const { day, month } = formatEventDay(ev.date);
          return (
            <Link
              key={ev.id}
              href="/calendario"
              className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:border-ring/50 hover:bg-accent"
            >
              <div className="flex w-11 shrink-0 flex-col items-center rounded-md bg-accent py-1 text-muted-foreground">
                <span className="text-[9px] font-semibold tracking-wide">{month}</span>
                <span className="text-[15px] font-semibold text-foreground">{day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{ev.title}</p>
                <p className="truncate text-[12px] text-muted-foreground">{ev.timeLabel}</p>
              </div>
              {ev.attendees > 0 && (
                <div className="flex -space-x-2">
                  {Array.from({ length: ev.attendees }).map((_, i) => (
                    <span key={i} className="h-6 w-6 rounded-full border-2 border-background bg-muted" style={{ zIndex: 10 - i }} />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
        {upcomingEvents.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">Nenhum evento futuro agendado.</p>
        )}
      </div>
    </section>
  );
}

async function UrgentReminders({ userId }: { userId: string }) {
  const urgentReminders = await getUrgentReminders(userId, 5);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-foreground">Lembretes Urgentes</h2>
      </div>
      <HomeUrgentList reminders={urgentReminders.map((r) => ({ id: r.id, title: r.title, done: r.done }))} />
    </section>
  );
}

async function RecentNotes({ userId }: { userId: string }) {
  const recentNotes = await getRecentNotes(userId, 4);
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-foreground">Notas Recentes</h2>
        <Link href="/notas" className="text-[12px] text-muted-foreground hover:text-foreground">
          Ver Tudo
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recentNotes.map((n) => {
          const kind = (n.coverKind ?? "image") as keyof typeof coverIcon;
          const Icon = coverIcon[kind];
          return (
            <Link
              key={n.id}
              href="/notas"
              className="flex flex-col overflow-hidden rounded-lg border border-border transition-colors hover:border-ring/50 hover:shadow-sm"
            >
              <div className="flex h-24 flex-col items-center justify-center gap-1.5 bg-accent text-muted-foreground">
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-[10px] text-muted-foreground">{coverLabel[kind]}</span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <p className="text-[13px] font-medium leading-snug text-foreground">{n.title}</p>
                <p className="line-clamp-3 flex-1 text-[12px] leading-relaxed text-muted-foreground">
                  {n.content.slice(0, 140) || "Nota em branco."}
                </p>
                <p className="pt-1 text-[11px] text-muted-foreground">{relativeTimePt(n.updatedAt)}</p>
              </div>
            </Link>
          );
        })}
        {recentNotes.length === 0 && <p className="text-[12.5px] text-muted-foreground">Nenhuma nota ainda.</p>}
      </div>
    </section>
  );
}

export default async function EntradaPage() {
  const user = await getCurrentUser();
  const userId = user?.id;
  
  if (!userId) {
    return null;
  }

  const today = new Date();
  const weekday = today.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateStr = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const formattedDate = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dateStr}`;

  return (
    <div className="mx-auto max-w-[1080px] px-10 py-10">
      <h1 className="text-[26px] font-semibold text-foreground">Bom dia, {user.name || "Usuário"}</h1>
      <p className="mt-1 text-[13px] capitalize text-muted-foreground">{formattedDate}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<PageSkeleton />}>
          <UpcomingEvents userId={userId} />
        </Suspense>
        <Suspense fallback={<PageSkeleton />}>
          <UrgentReminders userId={userId} />
        </Suspense>
      </div>

      <Suspense fallback={<PageSkeleton />}>
        <RecentNotes userId={userId} />
      </Suspense>
    </div>
  );
}