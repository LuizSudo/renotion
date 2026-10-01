import { Suspense } from 'react';
import { getEvents, getReminders } from "@/lib/db/queries";
import { getCurrentUserId } from "@/lib/server-auth";
import CalendarioClient from "@/components/CalendarioClient";
import { CalendarioSkeleton } from "@/components/PageSkeleton";

export const dynamic = "force-dynamic";

async function CalendarioContent({ userId }: { userId: string }) {
  const [events, reminders] = await Promise.all([getEvents(userId), getReminders(userId)]);
  return <CalendarioClient events={events} reminders={reminders} />;
}

export default async function CalendarioPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return (
    <Suspense fallback={<CalendarioSkeleton />}>
      <CalendarioContent userId={userId} />
    </Suspense>
  );
}