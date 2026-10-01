import { Suspense } from 'react';
import { getNotes, getBacklinksFor, getRelatedNotesFor } from "@/lib/db/queries";
import { getCurrentUserId } from "@/lib/server-auth";
import NotasClient from "@/components/NotasClient";
import { NotasSkeleton } from "@/components/PageSkeleton";

export const dynamic = "force-dynamic";

async function NotasContent({ userId }: { userId: string }) {
  const notes = await getNotes(userId);
  const enriched = await Promise.all(
    notes.map(async (n) => ({
      ...n,
      backlinks: await getBacklinksFor(userId, n.id),
      relatedNotes: await getRelatedNotesFor(userId, n.id),
    }))
  );
  return <NotasClient notes={enriched} />;
}

export default async function NotasPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  return (
    <Suspense fallback={<NotasSkeleton />}>
      <NotasContent userId={userId} />
    </Suspense>
  );
}