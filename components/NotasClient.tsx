"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Link2,
  Image as ImageIcon,
  ListChecks,
  Quote,
  Code2,
  FileText,
  Trash2,
  Image,
  X,
  Wifi,
} from "lucide-react";
import type { getNotes } from "@/lib/db/queries";
import {
  addNoteTag,
  createNote,
  deleteNote,
  updateNoteContent,
  updateNoteTitle,
  updateNoteCover,
} from "@/lib/db/actions";
import { relativeTimePt, wordCount } from "@/lib/format";
import { FileUpload } from "@/components/FileUpload";
import { useNoteUpdates } from "@/lib/realtime";

type BaseNote = Awaited<ReturnType<typeof getNotes>>[number];
type Note = BaseNote & {
  backlinks: { id: string; title: string }[];
  relatedNotes: { id: string; title: string }[];
  coverFile?: { id: string; url: string; name: string; mimeType: string; size: number } | null;
};

const folders: { key: Note["folder"]; label: string }[] = [
  { key: "projetos", label: "PROJETOS" },
  { key: "drafts", label: "DRAFTS" },
  { key: "pessoal", label: "PESSOAL" },
  { key: "arquivo", label: "ARQUIVO" },
];

const coverIcon = { image: ImageIcon, checklist: ListChecks, quote: Quote, code: Code2 } as const;

export default function NotasClient({ notes }: { notes: Note[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    projetos: true,
    drafts: true,
    pessoal: true,
    arquivo: true,
  });
  const [newTag, setNewTag] = useState("");
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const lastKnownContent = useRef("");

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  // Real-time updates
  const remoteUpdate = useNoteUpdates(selectedId);
  
  // Derived state instead of useEffect with setState
  const showRemoteUpdate = Boolean(remoteUpdate && selected && remoteUpdate.content !== selected.content);
  
  // Update ref when remote update arrives
  useEffect(() => {
    if (remoteUpdate && selected && remoteUpdate.content !== selected.content) {
      lastKnownContent.current = remoteUpdate.content;
    }
  }, [remoteUpdate, selected]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? notes.filter((n) => n.title.toLowerCase().includes(q)) : notes;
    return folders.map((f) => ({ ...f, items: filtered.filter((n) => n.folder === f.key) }));
  }, [notes, query]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleCreateNote() {
    const id = await createNote({ title: "Nova nota", folder: "drafts" });
    refresh();
    if (id) setSelectedId(id);
  }

  async function handleTitleBlur(id: string, value: string) {
    await updateNoteTitle(id, value);
    refresh();
  }

  async function handleContentBlur(id: string, value: string) {
    await updateNoteContent(id, value);
    lastKnownContent.current = value;
    refresh();
  }

  function handleContentChange() {
    // No-op: using defaultValue from selected.content
  }

  async function handleAddTag() {
    if (!selected || !newTag.trim()) return;
    await addNoteTag(selected.id, newTag);
    setNewTag("");
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    if (selectedId === id) setSelectedId(notes.find((n) => n.id !== id)?.id ?? null);
    refresh();
  }

  async function handleCoverUpload(file: { id: string; url: string; name: string; mimeType: string; size: number }) {
    if (!selected) return;
    await updateNoteCover(selected.id, "image", file.id);
    setShowCoverUpload(false);
    refresh();
  }

  async function handleRemoveCover() {
    if (!selected) return;
    await updateNoteCover(selected.id, null, null);
    refresh();
  }

  async function handleMergeRemote() {
    if (!selected || !remoteUpdate) return;
    await updateNoteContent(selected.id, remoteUpdate.content);
    lastKnownContent.current = remoteUpdate.content;
    refresh();
  }

  async function handleKeepLocal() {
    if (!selected) return;
    await updateNoteContent(selected.id, selected.content);
    lastKnownContent.current = selected.content;
    refresh();
  }

  const coverImageUrl = selected?.coverFile?.url;

  return (
    <div className="flex h-full">
      {/* Notes list */}
      <div className="flex w-[260px] shrink-0 flex-col border-r border-border">
        <div className="flex items-center justify-between px-4 py-3.5">
          <h1 className="text-[14px] font-semibold text-foreground">Todas as Notas</h1>
          <button onClick={handleCreateNote} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <Plus size={15} />
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-muted-foreground">
            <Search size={13} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar Notas..."
              className="w-full bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {grouped.map((f) =>
            f.items.length ? (
              <div key={f.key} className="mb-1">
                <button
                  onClick={() => setOpenFolders((p) => ({ ...p, [f.key]: !p[f.key] }))}
                  className="flex w-full items-center gap-1 px-2 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground hover:text-foreground"
                >
                  {openFolders[f.key] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {f.label}
                </button>
                {openFolders[f.key] && (
                  <div className="flex flex-col gap-0.5 pl-1">
                    {f.items.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedId(n.id)}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px] transition-colors
                          ${selectedId === n.id ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"}
                        `}
                      >
                        <FileText size={13} className="shrink-0 text-muted-foreground" />
                        <span className="truncate">{n.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          )}
          {notes.length === 0 && <p className="px-3 py-4 text-[12.5px] text-muted-foreground">Nenhuma nota ainda.</p>}
        </div>
      </div>

      {/* Editor */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-8 py-3">
              <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                <span className="capitalize">{selected.folder}</span>
                <ChevronRight size={12} />
                <span className="text-foreground">{selected.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {showRemoteUpdate && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                    <Wifi className="text-amber-500" size={14} />
                    <span className="text-amber-400">Conteúdo atualizado remotamente</span>
                    <button onClick={handleMergeRemote} className="text-xs text-amber-400 hover:underline">Mesclar</button>
                    <button onClick={handleKeepLocal} className="text-xs text-amber-400 hover:underline">Manter local</button>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-red-500"
                  title="Excluir nota"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="mx-auto max-w-[720px] px-8 py-8">
              <input
                key={`title-${selected.id}`}
                defaultValue={selected.title}
                onBlur={(e) => handleTitleBlur(selected.id, e.target.value)}
                className="w-full text-[30px] font-bold text-foreground focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {selected.tags.map((t) => (
                  <span key={t} className="rounded-md bg-accent px-2 py-1 text-[11.5px] text-muted-foreground">
                    {t}
                  </span>
                ))}
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="+ Add Tag"
                  className="w-24 rounded-md border border-dashed border-border bg-card px-2 py-1 text-[11.5px] text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring"
                />
              </div>

              <textarea
                key={`content-${selected.id}`}
                defaultValue={selected.content}
                onChange={handleContentChange}
                onBlur={(e) => handleContentBlur(selected.id, e.target.value)}
                placeholder="Comece a escrever... Use [[Título da Nota]] para criar backlinks"
                className="mt-6 min-h-[320px] w-full resize-none text-[15px] leading-[1.75] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />

              {/* Cover Image */}
              <div className="mt-6">
                {coverImageUrl ? (
                  <div className="relative max-w-md">
                    <img
                      src={coverImageUrl}
                      alt={selected.title}
                      className="w-full h-auto rounded-lg border border-border"
                    />
                    <button
                      onClick={handleRemoveCover}
                      className="absolute top-2 right-2 rounded-full bg-card/90 p-1 hover:bg-card shadow-md"
                      title="Remover capa"
                    >
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCoverUpload(true)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Image size={16} /> Adicionar imagem de capa
                  </button>
                )}

                {showCoverUpload && !coverImageUrl && (
                  <div className="mt-3">
                    <FileUpload
                      accept="image/*"
                      onUpload={handleCoverUpload}
                      maxSizeMB={5}
                    />
                    <button
                      onClick={() => setShowCoverUpload(false)}
                      className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* Placeholder icons for non-image covers */}
              {selected.coverKind && selected.coverKind !== "image" && !coverImageUrl && (
                <div className="mt-6 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-accent text-muted-foreground">
                  {(() => {
                    const Icon = coverIcon[selected.coverKind as keyof typeof coverIcon];
                    return Icon ? <Icon size={22} strokeWidth={1.5} /> : null;
                  })()}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            Crie a primeira nota para começar.
          </div>
        )}
      </div>

      {/* Backlinks panel */}
      {selected && (
        <div className="hidden w-[260px] shrink-0 flex-col border-l border-border px-5 py-4 xl:flex">
          <h3 className="mb-3 text-[11px] font-semibold tracking-wide text-muted-foreground">BACKLINKS</h3>
          <div className="flex flex-col gap-3">
            {selected.backlinks.length ? (
              selected.backlinks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className="rounded-md border border-border bg-card px-3 py-2 text-left hover:border-ring/50"
                >
                  <p className="truncate text-[12.5px] text-foreground">{b.title}</p>
                </button>
              ))
            ) : (
              <p className="text-[12.5px] text-muted-foreground">
                Nenhum backlink ainda. Use <code className="bg-accent px-1 rounded">[[Título da Nota]]</code> no conteúdo de outra nota.
              </p>
            )}
          </div>

          <h3 className="mb-3 mt-6 text-[11px] font-semibold tracking-wide text-muted-foreground">NOTAS RELACIONADAS</h3>
          <div className="flex flex-col gap-2">
            {selected.relatedNotes.length ? (
              selected.relatedNotes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="flex items-center gap-2 text-left text-[12.5px] text-muted-foreground hover:text-foreground"
                >
                  <Link2 size={12} className="shrink-0 text-muted-foreground/50" />
                  <span className="truncate">{r.title}</span>
                </button>
              ))
            ) : (
              <p className="text-[12.5px] text-muted-foreground">Nenhuma nota relacionada.</p>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-card p-3.5">
            <h4 className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground">ESTATÍSTICAS DO EDITOR</h4>
            <div className="flex items-center justify-between py-1 text-[12.5px]">
              <span className="text-muted-foreground">Palavras</span>
              <span className="text-foreground">{wordCount(selected?.content || "")}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-[12.5px]">
              <span className="text-muted-foreground">Última edição</span>
              <span className="text-foreground">{relativeTimePt(selected.updatedAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}