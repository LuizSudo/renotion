import { Suspense } from 'react';
import { getEventsByDate, getTodayReminders } from "@/lib/db/queries";
import { getCurrentUserId } from "@/lib/server-auth";
import HojeClient from "@/components/HojeClient";

export const dynamic = "force-dynamic";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function HojeContent({ userId }: { userId: string }) {
  const iso = todayISO();
  const [reminders, events] = await Promise.all([getTodayReminders(userId), getEventsByDate(userId, iso)]);

  const dateLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return <HojeClient reminders={reminders} events={events} dateLabel={dateLabel} />;
}

export default async function HojePage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return (
    <Suspense fallback={<div className="mx-auto max-w-[760px] px-10 py-10 animate-pulse space-y-4"><div className="h-8 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /><div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_220px]"><div className="space-y-2"><div className="h-4 w-32 bg-muted rounded" /><div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div></div><div className="space-y-2"><div className="h-4 w-24 bg-muted rounded" /><div className="space-y-3">{[1,2].map(i=><div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div></div></div></div>}>
      <HojeContent userId={userId} />
    </Suspense>
  );
}