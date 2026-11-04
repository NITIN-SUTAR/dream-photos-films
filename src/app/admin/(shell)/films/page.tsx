"use client";

import { useMemo, useState } from "react";
import { Clock, Film, Pencil, Play, Plus, Star, Trash2 } from "lucide-react";
import { api, ApiFailure, useApi, type FilmDTO } from "@/lib/api";
import { FILM_CATEGORIES } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ActiveDot, DataTable, FilterChips, PageIntro, ReorderControls, Toolbar, UploadPanel, type Column } from "@/components/admin/parts";
import { Badge, Button, EmptyState, ErrorState, IconButton, Input, LoadingSkeleton, Textarea, Toggle } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog, Tabs, useToast } from "@/components/ui/overlays";

type CatFilter = "All" | (typeof FILM_CATEGORIES)[number];

export default function AdminFilmsPage() {
  const { data, loading, error, refetch } = useApi<{ films: FilmDTO[] }>("/api/admin/films");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<CatFilter>("All");
  const [draft, setDraft] = useState<FilmDTO | null>(null);
  const [preview, setPreview] = useState<FilmDTO | null>(null);
  const [toDelete, setToDelete] = useState<FilmDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFilm, setNewFilm] = useState({
    title: "",
    category: FILM_CATEGORIES[0] as string,
    description: "",
    duration: "0:00",
    posterUrl: "",
    posterAssetId: "",
    videoUrl: "",
    videoAssetId: "",
  });
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.films ?? [])
      .filter((f) => cat === "All" || f.category === cat)
      .filter((f) => !q || `${f.title} ${f.description}`.toLowerCase().includes(q));
  }, [data, search, cat]);

  async function mutate(fn: () => Promise<unknown>, title: string) {
    setBusy(true);
    try {
      await fn();
      await refetch();
      push({ tone: "success", title });
      return true;
    } catch (err) {
      push({ tone: "error", title: "That did not save", description: (err as ApiFailure).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function move(f: FilmDTO, dir: -1 | 1) {
    const list = data?.films ?? [];
    const i = list.findIndex((x) => x.id === f.id);
    const other = list[i + dir];
    if (!other) return;
    await mutate(
      () =>
        Promise.all([
          api.patch(`/api/admin/films/${f.id}`, { displayOrder: other.displayOrder }),
          api.patch(`/api/admin/films/${other.id}`, { displayOrder: f.displayOrder }),
        ]),
      "Order updated",
    );
  }

  const columns: Column<FilmDTO>[] = [
    {
      key: "film",
      header: "Film",
      render: (f) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.poster.src} alt="" width={72} height={40} loading="lazy" className="h-10 w-[72px] shrink-0 rounded-[6px] object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[13px] text-bone">{f.title}</p>
            <p className="truncate text-[11.5px] text-muted">{f.description}</p>
          </div>
        </div>
      ),
    },
    { key: "cat", header: "Category", render: (f) => <Badge>{f.category}</Badge> },
    {
      key: "duration",
      header: "Duration",
      render: (f) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-muted">
          <Clock aria-hidden className="h-3 w-3" />
          {f.duration}
        </span>
      ),
    },
    {
      key: "flags",
      header: "Flags",
      render: (f) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mutate(() => api.patch(`/api/admin/films/${f.id}`, { featured: !f.featured }), "Updated")}
            aria-pressed={f.featured}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors",
              f.featured ? "border-accent/45 bg-accent/12 text-accent-soft" : "border-white/10 text-muted hover:text-bone",
            )}
          >
            <Star aria-hidden className={cn("h-3 w-3", f.featured && "fill-accent")} /> Featured
          </button>
          <ActiveDot active={f.active} />
        </div>
      ),
    },
    { key: "order", header: "Order", render: (f) => <ReorderControls onUp={() => move(f, -1)} onDown={() => move(f, 1)} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (f) => (
        <span className="inline-flex gap-1">
          <IconButton label="Preview" icon={Play} size="sm" variant="ghost" onClick={() => setPreview(f)} />
          <IconButton label="Edit" icon={Pencil} size="sm" variant="ghost" onClick={() => setDraft(f)} />
          <IconButton label="Delete" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(f)} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageIntro
        title="Films"
        description="Cinematic work published on the website. Featured films appear as large previews on the homepage."
        actions={
          <>
            <Tabs size="sm" value={view} onChange={setView} tabs={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]} />
            <Button size="sm" variant="accent" icon={Plus} onClick={() => setCreating(true)}>
              Add film
            </Button>
          </>
        }
      />

      <Toolbar search={search} onSearch={setSearch} placeholder="Search films">
        <FilterChips<CatFilter>
          label="Filter by category"
          value={cat}
          onChange={setCat}
          options={[
            { value: "All", label: "All", count: data?.films.length ?? 0 },
            ...FILM_CATEGORIES.map((c) => ({
              value: c as CatFilter,
              label: c.replace(" Films", ""),
              count: (data?.films ?? []).filter((f) => f.category === c).length,
            })),
          ]}
        />
      </Toolbar>

      {error ? (
        <ErrorState title="Films unavailable" description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Film} title="No films in this category" description="Publish a film to show it in the cinematic section of the website." />
      ) : view === "list" ? (
        <DataTable rows={items} columns={columns} empty={null} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((f) => (
            <li
              key={f.id}
              className={cn(
                "group overflow-hidden rounded-[12px] border border-white/8 bg-white/[0.02] transition-all duration-400 hover:-translate-y-0.5 hover:border-white/20",
                !f.active && "opacity-55",
              )}
            >
              <button type="button" onClick={() => setPreview(f)} className="relative block aspect-video w-full overflow-hidden" aria-label={`Preview ${f.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.poster.src} alt={f.poster.alt} width={f.poster.width} height={f.poster.height} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-ink/35">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full glass-strong">
                    <Play className="ml-0.5 h-4 w-4 fill-bone text-bone" />
                  </span>
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2 py-0.5 font-mono text-[9.5px] text-bone backdrop-blur">
                  {f.duration}
                </span>
              </button>
              <div className="p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">{f.category}</p>
                <h3 className="display mt-1 text-[20px] text-bone">{f.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted">{f.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
                  <ActiveDot active={f.active} />
                  <span className="flex items-center gap-0.5">
                    <ReorderControls onUp={() => move(f, -1)} onDown={() => move(f, 1)} />
                    <IconButton label="Edit" icon={Pencil} size="sm" variant="ghost" onClick={() => setDraft(f)} />
                    <IconButton label="Delete" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(f)} />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Add a film"
        description="Poster and film file are stored and verified before the record is published."
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              variant="accent"
              size="sm"
              loading={busy}
              disabled={!newFilm.title || !newFilm.posterUrl || !newFilm.videoUrl}
              onClick={async () => {
                const done = await mutate(() => api.post("/api/admin/films", newFilm), "Film published");
                if (done) {
                  setCreating(false);
                  setNewFilm({ title: "", category: FILM_CATEGORIES[0], description: "", duration: "0:00", posterUrl: "", posterAssetId: "", videoUrl: "", videoAssetId: "" });
                }
              }}
            >
              Publish film
            </Button>
          </>
        }
      >
        <UploadPanel scope="films" kind="IMAGE" label="Drop a poster frame" hint="JPG or PNG · 1920×1080 recommended" onReady={(a) => setNewFilm((f) => ({ ...f, posterUrl: a.url, posterAssetId: a.assetId }))} />
        <div className="mt-4">
          <UploadPanel scope="films" kind="VIDEO" label="Drop the film file" hint="MP4 or WebM · up to 200MB preview cut" onReady={(a) => setNewFilm((f) => ({ ...f, videoUrl: a.url, videoAssetId: a.assetId }))} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Title" value={newFilm.title} onChange={(e) => setNewFilm({ ...newFilm, title: e.target.value })} />
          <Input label="Duration" value={newFilm.duration} onChange={(e) => setNewFilm({ ...newFilm, duration: e.target.value })} />
          <div className="sm:col-span-2">
            <FilterChips label="Category" value={newFilm.category} onChange={(v) => setNewFilm({ ...newFilm, category: v })} options={FILM_CATEGORIES.map((c) => ({ value: c as string, label: c }))} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Description" value={newFilm.description} onChange={(e) => setNewFilm({ ...newFilm, description: e.target.value })} />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title="Edit film"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
            <Button
              variant="accent"
              size="sm"
              loading={busy}
              onClick={async () => {
                if (!draft) return;
                const done = await mutate(
                  () =>
                    api.patch(`/api/admin/films/${draft.id}`, {
                      title: draft.title,
                      category: draft.category,
                      description: draft.description,
                      duration: draft.duration,
                      featured: draft.featured,
                      active: draft.active,
                    }),
                  "Film updated",
                );
                if (done) setDraft(null);
              }}
            >
              Save film
            </Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <Input label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <FilterChips label="Category" value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={FILM_CATEGORIES.map((c) => ({ value: c as string, label: c }))} />
            <Textarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <Input label="Duration" value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} />
            <Toggle label="Featured" description="Featured films appear as large previews on the homepage." checked={draft.featured} onChange={(v) => setDraft({ ...draft, featured: v })} />
            <Toggle label="Active" checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
          </div>
        )}
      </Dialog>

      <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ""} size="lg" description={preview?.category}>
        {preview && <video src={preview.video} poster={preview.poster.src} controls preload="none" playsInline className="w-full rounded-[10px]" />}
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={busy}
        tone="danger"
        confirmLabel="Delete film"
        title="Delete this film?"
        message={`“${toDelete?.title}” and its stored media will be removed.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await mutate(() => api.del(`/api/admin/films/${toDelete.id}`), "Film deleted");
          setToDelete(null);
        }}
      />
    </div>
  );
}
