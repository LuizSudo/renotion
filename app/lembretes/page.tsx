import { Suspense } from 'react';
import { getReminders } from "@/lib/db/queries";
import { getCurrentUserId } from "@/lib/server-auth";
import LembretesClient from "@/components/LembretesClient";
import { LembretesSkeleton } from "@/components/PageSkeleton";

export const dynamic = "force-dynamic";

async function LembretesContent({ userId }: { userId: string }) {
  const reminders = await getReminders(userId);
  return <LembretesClient reminders={reminders} />;
}

export default async function LembretesPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return (
    <Suspense fallback={<LembretesSkeleton />}>
      <LembretesContent userId={userId} />
    </Suspense>
  );
}