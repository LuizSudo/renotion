export type Priority = "HIGH" | "MED" | "LOW";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface RelatedLink {
  type: "note" | "event";
  label: string;
  title: string;
  href: string;
}

export interface Reminder {
  id: string;
  title: string;
  done: boolean;
  group: "overdue" | "hoje" | "proximos" | "completed";
  dueDateLabel?: string;
  dueDateISO?: string;
  timeLabel?: string;
  priority?: Priority;
  space: "projetos" | "pessoal" | "arquivo";
  description?: string;
  createdBy?: string;
  subtasks?: Subtask[];
  related?: RelatedLink[];
}

export interface Note {
  id: string;
  title: string;
  tags: string[];
  folder: "projetos" | "drafts" | "arquivo" | "pessoal";
  excerpt: string;
  content: string[];
  wordCount: number;
  lastEdited: string;
  hasCover?: boolean;
  coverKind?: "image" | "checklist" | "quote" | "code";
  backlinks: { title: string; context: string }[];
  relatedNotes: { title: string; icon: "link" }[];
}

export interface CalendarEvent {
  id: string;
  day: number;
  month: number;
  year: number;
  title: string;
  timeLabel?: string;
  allDay?: boolean;
  location?: string;
  attendees?: number;
  variant: "dark" | "light";
}

export interface DayTask {
  id: string;
  title: string;
  done: boolean;
  tag?: string;
}
