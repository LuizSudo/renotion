"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
import { db } from "./client";
import { events, files, notes, reminders, subtasks } from "./schema";
import { broadcastToUser } from "@/app/api/realtime/route";
import { z } from 'zod';
import {
  createReminderSchema,
  updateReminderSchema,
  toggleReminderSchema,
  deleteReminderSchema,
  addSubtaskSchema,
  toggleSubtaskSchema,
  createNoteSchema,
  updateNoteTitleSchema,
  updateNoteContentSchema,
  updateNoteCoverSchema,
  addNoteTagSchema,
  deleteNoteSchema,
  moveNoteToFolderSchema,
  createEventSchema,
  deleteEventSchema,
  createFileSchema,
  deleteFileSchema,
} from "@/lib/validations";

function nowISO() {
  return new Date().toISOString();
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.user?.id ?? null;
}

function revalidateAll() {
  for (const path of ["/", "/hoje", "/calendario", "/notas", "/lembretes", "/projetos", "/pessoal", "/arquivo"]) {
    revalidatePath(path);
  }
}

function notifyUser(userId: string, event: string, data: unknown) {
  try {
    broadcastToUser(userId, event, data);
  } catch {
    // Ignore broadcast errors (connection might be closed)
  }
}

// Helper function to validate input with Zod schema
function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Validation failed: ${errors}`);
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------
export async function toggleReminderDone(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(toggleReminderSchema, { id });
  
  const current = await db.query.reminders.findFirst({ 
    where: and(eq(reminders.id, validated.id), eq(reminders.userId, userId)) 
  });
  if (!current) return;
  
  const updatedAt = nowISO();
  await db
    .update(reminders)
    .set({ done: !current.done, updatedAt })
    .where(and(eq(reminders.id, validated.id), eq(reminders.userId, userId)));
  
  notifyUser(userId, "reminder_updated", { reminderId: validated.id, done: !current.done, updatedAt });
  revalidateAll();
}

export async function createReminder(input: {
  title: string;
  space?: string;
  dueDate?: string | null;
  priority?: string | null;
}) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(createReminderSchema, input);
  const title = validated.title.trim();
  
  const id = randomUUID();
  await db.insert(reminders).values({
    id,
    userId,
    title,
    done: false,
    group: "proximos",
    space: validated.space ?? "projetos",
    dueDate: validated.dueDate ?? null,
    priority: validated.priority ?? null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });
  revalidateAll();
  return id;
}

export async function updateReminder(
  id: string,
  data: Partial<{ title: string; description: string; priority: string | null; dueDate: string | null }>
) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(updateReminderSchema, { id, ...data });
  const updatedAt = nowISO();
  
  await db
    .update(reminders)
    .set({ ...validated, updatedAt })
    .where(and(eq(reminders.id, validated.id), eq(reminders.userId, userId)));
  revalidateAll();
}

export async function deleteReminder(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(deleteReminderSchema, { id });
  
  await db.delete(reminders).where(and(eq(reminders.id, validated.id), eq(reminders.userId, userId)));
  revalidateAll();
}

// ---------------------------------------------------------------------------
// Subtasks
// ---------------------------------------------------------------------------
export async function toggleSubtaskDone(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(toggleSubtaskSchema, { id });
  
  const current = await db.query.subtasks.findFirst({
    where: and(eq(subtasks.id, validated.id)),
    with: { reminder: true },
  });
  if (!current || current.reminder.userId !== userId) return;
  
  await db.update(subtasks).set({ done: !current.done }).where(eq(subtasks.id, validated.id));
  revalidateAll();
}

export async function addSubtask(reminderId: string, title: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(addSubtaskSchema, { reminderId, title });
  const clean = validated.title.trim();
  
  const reminder = await db.query.reminders.findFirst({
    where: and(eq(reminders.id, validated.reminderId), eq(reminders.userId, userId)),
  });
  if (!reminder) return;
  
  await db.insert(subtasks).values({ 
    id: randomUUID(), 
    reminderId: validated.reminderId, 
    title: clean, 
    done: false, 
    position: 0 
  });
  revalidateAll();
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
export async function createNote(input: { title: string; folder?: string }) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(createNoteSchema, input);
  const title = validated.title.trim() || "Sem título";
  
  const id = randomUUID();
  await db.insert(notes).values({
    id,
    userId,
    title,
    folder: validated.folder ?? "projetos",
    content: "",
    tags: "[]",
    position: 0,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });
  revalidateAll();
  return id;
}

export async function updateNoteContent(id: string, content: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(updateNoteContentSchema, { id, content });
  const updatedAt = nowISO();
  
  await db
    .update(notes)
    .set({ content: validated.content, updatedAt })
    .where(and(eq(notes.id, validated.id), eq(notes.userId, userId)));
  
  notifyUser(userId, "note_updated", { noteId: validated.id, content: validated.content, updatedAt });
  revalidateAll();
}

export async function updateNoteTitle(id: string, title: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(updateNoteTitleSchema, { id, title });
  const clean = validated.title.trim() || "Sem título";
  const updatedAt = nowISO();
  
  await db
    .update(notes)
    .set({ title: clean, updatedAt })
    .where(and(eq(notes.id, validated.id), eq(notes.userId, userId)));
  revalidateAll();
}

export async function updateNoteCover(id: string, coverKind: string | null, coverFileId: string | null) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(updateNoteCoverSchema, { id, coverKind, coverFileId });
  
  await db
    .update(notes)
    .set({ coverKind: validated.coverKind, coverFileId: validated.coverFileId, updatedAt: nowISO() })
    .where(and(eq(notes.id, validated.id), eq(notes.userId, userId)));
  revalidateAll();
}

export async function addNoteTag(id: string, tag: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(addNoteTagSchema, { id, tag });
  const clean = validated.tag.trim().replace(/\s+/g, "-");
  if (!clean) return;
  
  const note = await db.query.notes.findFirst({
    where: and(eq(notes.id, validated.id), eq(notes.userId, userId)),
  });
  if (!note) return;
  
  const tags = JSON.parse(note.tags) as string[];
  const withHash = clean.startsWith("#") ? clean : `#${clean}`;
  if (!tags.includes(withHash)) tags.push(withHash);
  
  await db
    .update(notes)
    .set({ tags: JSON.stringify(tags), updatedAt: nowISO() })
    .where(and(eq(notes.id, validated.id), eq(notes.userId, userId)));
  revalidateAll();
}

export async function deleteNote(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(deleteNoteSchema, { id });
  
  await db.delete(notes).where(and(eq(notes.id, validated.id), eq(notes.userId, userId)));
  revalidateAll();
}

export async function moveNoteToFolder(id: string, folder: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(moveNoteToFolderSchema, { id, folder });
  
  await db
    .update(notes)
    .set({ folder: validated.folder, updatedAt: nowISO() })
    .where(and(eq(notes.id, validated.id), eq(notes.userId, userId)));
  revalidateAll();
}

// ---------------------------------------------------------------------------
// Calendar events
// ---------------------------------------------------------------------------
export async function createEvent(input: {
  title: string;
  date: string;
  timeLabel?: string | null;
  variant?: "dark" | "light";
}) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(createEventSchema, input);
  const title = validated.title.trim();
  
  await db.insert(events).values({
    id: randomUUID(),
    userId,
    title,
    date: validated.date,
    timeLabel: validated.timeLabel ?? null,
    variant: validated.variant ?? "light",
    attendees: 0,
    allDay: !validated.timeLabel,
    createdAt: nowISO(),
  });
  revalidateAll();
}

export async function deleteEvent(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(deleteEventSchema, { id });
  
  await db.delete(events).where(and(eq(events.id, validated.id), eq(events.userId, userId)));
  revalidateAll();
}

// ---------------------------------------------------------------------------
// Files/Uploads
// ---------------------------------------------------------------------------
export async function createFileRecord(input: {
  name: string;
  url: string;
  mimeType: string;
  size: number;
  key?: string;
}) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(createFileSchema, input);
  
  const id = randomUUID();
  await db.insert(files).values({
    id,
    userId,
    name: validated.name,
    url: validated.url,
    mimeType: validated.mimeType,
    size: validated.size,
    key: validated.key,
    createdAt: nowISO(),
  });
  revalidateAll();
  return id;
}

export async function deleteFile(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = validateInput(deleteFileSchema, { id });
  
  await db.delete(files).where(and(eq(files.id, validated.id), eq(files.userId, userId)));
  revalidateAll();
}