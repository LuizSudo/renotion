import "server-only";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "./client";
import { events, files, notes, reminders, subtasks, users } from "./schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function resolveGroup(r: { done: boolean; dueDate: string | null; group: string }) {
  if (r.done) return "completed" as const;
  const today = todayISO();
  if (!r.dueDate) return (r.group === "overdue" ? "proximos" : r.group) as
    | "hoje"
    | "proximos"
    | "completed";
  if (r.dueDate < today) return "overdue" as const;
  if (r.dueDate === today) return "hoje" as const;
  return "proximos" as const;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function getUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------
export async function getReminders(userId: string) {
  const rows = await db.query.reminders.findMany({
    where: eq(reminders.userId, userId),
    orderBy: [asc(reminders.position), asc(reminders.createdAt)],
    with: { 
      subtasks: { orderBy: [asc(subtasks.position)] },
      user: { columns: { name: true } }
    },
  });
  return rows.map((r) => ({ ...r, group: resolveGroup(r) }));
}

export async function getReminderById(userId: string, id: string) {
  const row = await db.query.reminders.findFirst({
    where: and(eq(reminders.id, id), eq(reminders.userId, userId)),
    with: { 
      subtasks: { orderBy: [asc(subtasks.position)] },
      user: { columns: { name: true } }
    },
  });
  return row ? { ...row, group: resolveGroup(row) } : null;
}

export async function getRemindersBySpace(userId: string, space: string) {
  const rows = await getReminders(userId);
  return rows.filter((r) => r.space === space);
}

export async function getRemindersByDate(userId: string, dateISO: string) {
  const rows = await db.query.reminders.findMany({
    where: and(eq(reminders.userId, userId), eq(reminders.dueDate, dateISO)),
    orderBy: [asc(reminders.position)],
  });
  return rows;
}

export async function getTodayReminders(userId: string) {
  const rows = await getReminders(userId);
  return rows.filter((r) => r.group === "hoje");
}

export async function getCompletedReminders(userId: string) {
  const rows = await db.query.reminders.findMany({
    where: and(eq(reminders.userId, userId), eq(reminders.done, true)),
    orderBy: [asc(reminders.updatedAt)],
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
export async function getNotes(userId: string) {
  const rows = await db.query.notes.findMany({
    where: eq(notes.userId, userId),
    orderBy: [asc(notes.position)],
    with: { coverFile: true },
  });
  return rows.map((n) => ({ ...n, tags: JSON.parse(n.tags) as string[] }));
}

export async function getNoteById(userId: string, id: string) {
  const row = await db.query.notes.findFirst({
    where: and(eq(notes.id, id), eq(notes.userId, userId)),
    with: { coverFile: true },
  });
  if (!row) return null;
  return { ...row, tags: JSON.parse(row.tags) as string[] };
}

export async function getNotesByFolder(userId: string, folder: string | string[]) {
  const folders = Array.isArray(folder) ? folder : [folder];
  const rows = await getNotes(userId);
  return rows.filter((n) => folders.includes(n.folder));
}

// Backlinks com sintaxe [[Nota]] (wiki-links)
import { extractWikiLinks } from '@/lib/utils';

export async function getBacklinksFor(userId: string, noteId: string) {
  const target = await getNoteById(userId, noteId);
  if (!target) return [];
  const all = await getNotes(userId);
  return all
    .filter((n) => {
      if (n.id === noteId) return false;
      const wikiLinks = extractWikiLinks(n.content);
      return wikiLinks.includes(target.title.trim().toLowerCase());
    })
    .map((n) => ({ id: n.id, title: n.title }));
}

export async function getRelatedNotesFor(userId: string, noteId: string) {
  const target = await getNoteById(userId, noteId);
  if (!target) return [];
  const all = await getNotes(userId);
  return all
    .filter(
      (n) =>
        n.id !== noteId &&
        (n.folder === target.folder || n.tags.some((t) => target.tags.includes(t)))
    )
    .slice(0, 5)
    .map((n) => ({ id: n.id, title: n.title }));
}

// ---------------------------------------------------------------------------
// Calendar events
// ---------------------------------------------------------------------------
export async function getEvents(userId: string) {
  return db.query.events.findMany({
    where: eq(events.userId, userId),
    orderBy: [asc(events.date)],
  });
}

export async function getEventsInRange(userId: string, startISO: string, endISO: string) {
  return db.query.events.findMany({
    where: and(eq(events.userId, userId), gte(events.date, startISO), lte(events.date, endISO)),
    orderBy: [asc(events.date)],
  });
}

export async function getEventsByDate(userId: string, dateISO: string) {
  return db.query.events.findMany({
    where: and(eq(events.userId, userId), eq(events.date, dateISO)),
  });
}

export async function getUpcomingEvents(userId: string, limit = 3) {
  const today = todayISO();
  const rows = await db.query.events.findMany({
    where: and(eq(events.userId, userId), gte(events.date, today)),
    orderBy: [asc(events.date)],
  });
  return rows.slice(0, limit);
}

export async function getUrgentReminders(userId: string, limit = 5) {
  const rows = await getReminders(userId);
  return rows
    .filter((r) => r.group === "overdue" || r.group === "hoje" || r.done)
    .sort((a, b) => Number(a.done) - Number(b.done))
    .slice(0, limit);
}

export async function getRecentNotes(userId: string, limit = 4) {
  const rows = await db.query.notes.findMany({
    where: eq(notes.userId, userId),
    orderBy: [desc(notes.updatedAt)],
    with: { coverFile: true },
  });
  return rows.slice(0, limit).map((n) => ({ ...n, tags: JSON.parse(n.tags) as string[] }));
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------
export async function getFiles(userId: string) {
  return db.query.files.findMany({
    where: eq(files.userId, userId),
    orderBy: [desc(files.createdAt)],
  });
}

export async function getFileById(userId: string, id: string) {
  return db.query.files.findFirst({
    where: and(eq(files.id, id), eq(files.userId, userId)),
  });
}