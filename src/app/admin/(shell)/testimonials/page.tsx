"use client";

import { useMemo, useState } from "react";
import { MessageSquareQuote, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api, ApiFailure, useApi, type TestimonialDTO } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ActiveDot, PageIntro, ReorderControls, Toolbar } from "@/components/admin/parts";
import { Button, EmptyState, ErrorState, IconButton, Input, LoadingSkeleton, Textarea, Toggle } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog, useToast } from "@/components/ui/overlays";

interface Draft {
  id: string;
  name: string;
  quote: string;
  event: string;
  location: string;
  rating: number;
  featured: boolean;
  active: boolean;
}

const EMPTY: Draft = { id: "", name: "", quote: "", event: "", location: "", rating: 5, featured: false, active: true };

export default function AdminTestimonialsPage() {
  const { data, loading, error, refetch } = useApi<{ testimonials: TestimonialDTO[] }>("/api/admin/testimonials");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preview, setPreview] = useState<TestimonialDTO | null>(null);
  const [toDelete, setToDelete] = useState<TestimonialDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.testimonials ?? []).filter((t) => !q || `${t.name} ${t.quote} ${t.event}`.toLowerCase().includes(q));
  }, [data, search]);

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

  async function move(t: TestimonialDTO, dir: -1 | 1) {
    const list = data?.testimonials ?? [];
    const i = list.findIndex((x) => x.id === t.id);
    const other = list[i + dir];
    if (!other) return;
    await mutate(
      () =>
        Promise.all([
          api.patch(`/api/admin/testimonials/${t.id}`, { displayOrder: other.displayOrder }),
          api.patch(`/api/admin/testimonials/${other.id}`, { displayOrder: t.displayOrder }),
        ]),
      "Order updated",
    );
  }

  async function save() {
    if (!draft) return;
    const body = {
      name: draft.name,
      quote: draft.quote,
      event: draft.event,
      location: draft.location,
      rating: draft.rating,
      featured: draft.featured,
      active: draft.active,
    };
    const done = draft.id
      ? await mutate(() => api.patch(`/api/admin/testimonials/${draft.id}`, body), "Testimonial updated")
      : await mutate(() => api.post("/api/admin/testimonials", body), "Testimonial added");
    if (done) setDraft(null);
  }

  return (
    <div>
      <PageIntro
        title="Testimonials"
        description="Client words used in the editorial quote section of the website."
        actions={
          <Button size="sm" variant="accent" icon={Plus} onClick={() => setDraft({ ...EMPTY })}>
            New testimonial
          </Button>
        }
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search testimonials" />

      {error ? (
        <ErrorState title="Testimonials unavailable" description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="No testimonials yet" description="Add a client quote to build trust on the public website." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((t) => (
            <li key={t.id} className={cn("flex gap-4 rounded-[14px] panel p-5 transition-colors duration-300 hover:border-white/18", !t.active && "opacity-55")}>
              {t.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.image.src} alt="" width={64} height={80} loading="lazy" className="hidden h-20 w-16 shrink-0 rounded-[8px] object-cover sm:block" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] text-bone">{t.name}</p>
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
                      {t.event} · {t.location}
                    </p>
                  </div>
                  <span className="flex items-center gap-0.5" aria-label={`${t.rating} of 5`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} aria-hidden className="h-3 w-3 fill-accent text-accent" />
                    ))}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-muted">“{t.quote}”</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                  <div className="flex items-center gap-3">
                    <ActiveDot active={t.active} />
                    {t.featured && <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent">Featured</span>}
                  </div>
                  <span className="flex items-center gap-0.5">
                    <ReorderControls onUp={() => move(t, -1)} onDown={() => move(t, 1)} />
                    <IconButton label="Preview" icon={MessageSquareQuote} size="sm" variant="ghost" onClick={() => setPreview(t)} />
                    <IconButton
                      label="Edit"
                      icon={Pencil}
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft({
                          id: t.id,
                          name: t.name,
                          quote: t.quote,
                          event: t.event,
                          location: t.location,
                          rating: t.rating,
                          featured: t.featured,
                          active: t.active,
                        })
                      }
                    />
                    <IconButton label="Delete" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(t)} />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit testimonial" : "New testimonial"}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="accent" size="sm" loading={busy} onClick={save}>Save testimonial</Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <Input label="Client name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Textarea label="Testimonial" required value={draft.quote} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Event / service" value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })} />
              <Input label="Location" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            </div>
            <Input
              label="Rating (1–5)"
              type="number"
              min={1}
              max={5}
              value={draft.rating}
              onChange={(e) => setDraft({ ...draft, rating: Math.min(5, Math.max(1, Number(e.target.value))) })}
            />
            <Toggle label="Featured" checked={draft.featured} onChange={(v) => setDraft({ ...draft, featured: v })} />
            <Toggle label="Active" checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
          </div>
        )}
      </Dialog>

      <Dialog open={!!preview} onClose={() => setPreview(null)} title="Public preview" size="lg">
        {preview && (
          <blockquote className="rounded-[14px] border border-white/8 bg-white/[0.02] p-6">
            <p className="display text-[26px] leading-snug text-bone">{preview.quote}</p>
            <footer className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {preview.name} · {preview.event} · {preview.location}
            </footer>
          </blockquote>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={busy}
        tone="danger"
        confirmLabel="Delete testimonial"
        title="Delete this testimonial?"
        message={`The quote from ${toDelete?.name} will be removed from the website.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await mutate(() => api.del(`/api/admin/testimonials/${toDelete.id}`), "Testimonial deleted");
          setToDelete(null);
        }}
      />
    </div>
  );
}
