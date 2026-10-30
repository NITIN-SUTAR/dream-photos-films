"use client";

import { useMemo, useState } from "react";
import { Eye, Images, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api, ApiFailure, useApi, type PortfolioDTO } from "@/lib/api";
import { PORTFOLIO_CATEGORIES } from "@/lib/brand";
import { cn, formatDate } from "@/lib/utils";
import { ActiveDot, DataTable, FilterChips, PageIntro, ReorderControls, Toolbar, UploadPanel, type Column } from "@/components/admin/parts";
import { Badge, Button, EmptyState, ErrorState, IconButton, Input, LoadingSkeleton, Textarea, Toggle } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog, Tabs, useToast } from "@/components/ui/overlays";

type CatFilter = "All" | (typeof PORTFOLIO_CATEGORIES)[number];

export default function AdminPortfolioPage() {
  const { data, loading, error, refetch } = useApi<{ portfolio: PortfolioDTO[] }>("/api/admin/portfolio");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<CatFilter>("All");
  const [draft, setDraft] = useState<PortfolioDTO | null>(null);
  const [preview, setPreview] = useState<PortfolioDTO | null>(null);
  const [toDelete, setToDelete] = useState<PortfolioDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    category: PORTFOLIO_CATEGORIES[0] as string,
    description: "",
    imageUrl: "",
    width: 1200,
    height: 800,
    assetId: "",
  });
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.portfolio ?? [])
      .filter((p) => cat === "All" || p.category === cat)
      .filter((p) => !q || `${p.title} ${p.description} ${p.location ?? ""}`.toLowerCase().includes(q));
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

  async function move(p: PortfolioDTO, dir: -1 | 1) {
    const list = data?.portfolio ?? [];
    const i = list.findIndex((x) => x.id === p.id);
    const other = list[i + dir];
    if (!other) return;
    await mutate(
      () =>
        Promise.all([
          api.patch(`/api/admin/portfolio/${p.id}`, { displayOrder: other.displayOrder }),
          api.patch(`/api/admin/portfolio/${other.id}`, { displayOrder: p.displayOrder }),
        ]),
      "Order updated",
    );
  }

  const columns: Column<PortfolioDTO>[] = [
    {
      key: "image",
      header: "Frame",
      render: (p) => (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image.src} alt="" width={72} height={48} loading="lazy" className="h-12 w-[72px] shrink-0 rounded-[6px] object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[13px] text-bone">{p.title}</p>
            <p className="truncate text-[11.5px] text-muted">{p.location ?? ""}</p>
          </div>
        </div>
      ),
    },
    { key: "cat", header: "Category", render: (p) => <Badge>{p.category}</Badge> },
    {
      key: "dims",
      header: "Dimensions",
      render: (p) => <span className="font-mono text-[11.5px] text-muted">{p.image.width}×{p.image.height}</span>,
    },
    { key: "updated", header: "Updated", render: (p) => <span className="text-[11.5px] text-muted">{formatDate(p.updatedAt, "short")}</span> },
    {
      key: "flags",
      header: "Flags",
      render: (p) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mutate(() => api.patch(`/api/admin/portfolio/${p.id}`, { featured: !p.featured }), "Updated")}
            aria-pressed={p.featured}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors",
              p.featured ? "border-accent/45 bg-accent/12 text-accent-soft" : "border-white/10 text-muted hover:text-bone",
            )}
          >
            <Star aria-hidden className={cn("h-3 w-3", p.featured && "fill-accent")} />
            Featured
          </button>
          <ActiveDot active={p.active} />
        </div>
      ),
    },
    { key: "order", header: "Order", render: (p) => <ReorderControls onUp={() => move(p, -1)} onDown={() => move(p, 1)} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <span className="inline-flex gap-1">
          <IconButton label="Preview" icon={Eye} size="sm" variant="ghost" onClick={() => setPreview(p)} />
          <IconButton label="Edit" icon={Pencil} size="sm" variant="ghost" onClick={() => setDraft(p)} />
          <IconButton label="Delete" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(p)} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageIntro
        title="Portfolio"
        description="The public archive. Order, featured flags and visibility drive the editorial grid on the website."
        actions={
          <>
            <Tabs size="sm" value={view} onChange={setView} tabs={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]} />
            <Button size="sm" variant="accent" icon={Plus} onClick={() => setCreating(true)}>
              Add photograph
            </Button>
          </>
        }
      />

      <Toolbar search={search} onSearch={setSearch} placeholder="Search by title, location or note">
        <FilterChips<CatFilter>
          label="Filter by category"
          value={cat}
          onChange={setCat}
          options={[
            { value: "All", label: "All", count: data?.portfolio.length ?? 0 },
            ...PORTFOLIO_CATEGORIES.map((c) => ({
              value: c as CatFilter,
              label: c,
              count: (data?.portfolio ?? []).filter((i) => i.category === c).length,
            })),
          ]}
        />
      </Toolbar>

      {error ? (
        <ErrorState title="Portfolio unavailable" description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Images} title="No photographs here" description="Nothing matches this filter. Try another category or clear the search." />
      ) : view === "list" ? (
        <DataTable rows={items} columns={columns} empty={null} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <li
              key={p.id}
              className={cn(
                "group overflow-hidden rounded-[12px] border border-white/8 bg-white/[0.02] transition-all duration-400 hover:-translate-y-0.5 hover:border-white/20",
                !p.active && "opacity-55",
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image.src}
                  alt={p.image.alt}
                  width={p.image.width}
                  height={p.image.height}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                {p.featured && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-ink/60 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-accent backdrop-blur">
                    <Star aria-hidden className="h-2.5 w-2.5 fill-accent" /> Featured
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">{p.category}</p>
                  <p className="truncate text-[13.5px] text-bone">{p.title}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <ActiveDot active={p.active} />
                <span className="flex items-center gap-0.5">
                  <IconButton label="Preview" icon={Eye} size="sm" variant="ghost" onClick={() => setPreview(p)} />
                  <IconButton label="Edit" icon={Pencil} size="sm" variant="ghost" onClick={() => setDraft(p)} />
                  <IconButton label="Delete" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(p)} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Add photograph"
        description="The image is validated and stored before the portfolio record is published."
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              variant="accent"
              size="sm"
              loading={busy}
              disabled={!newItem.imageUrl || !newItem.title}
              onClick={async () => {
                const done = await mutate(() => api.post("/api/admin/portfolio", newItem), "Photograph published");
                if (done) {
                  setCreating(false);
                  setNewItem({ title: "", category: PORTFOLIO_CATEGORIES[0], description: "", imageUrl: "", width: 1200, height: 800, assetId: "" });
                }
              }}
            >
              Publish photograph
            </Button>
          </>
        }
      >
        <UploadPanel
          scope="portfolio"
          kind="IMAGE"
          onReady={(asset) =>
            setNewItem((n) => ({
              ...n,
              imageUrl: asset.url,
              assetId: asset.assetId,
              width: asset.width ?? 1200,
              height: asset.height ?? 800,
            }))
          }
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Category</p>
            <FilterChips
              label="Category"
              value={newItem.category}
              onChange={(v) => setNewItem({ ...newItem, category: v })}
              options={PORTFOLIO_CATEGORIES.map((c) => ({ value: c as string, label: c }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title="Edit photograph"
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
                    api.patch(`/api/admin/portfolio/${draft.id}`, {
                      title: draft.title,
                      category: draft.category,
                      description: draft.description,
                      featured: draft.featured,
                      active: draft.active,
                    }),
                  "Photograph updated",
                );
                if (done) setDraft(null);
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <Input label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Category</p>
              <FilterChips
                label="Category"
                value={draft.category}
                onChange={(v) => setDraft({ ...draft, category: v })}
                options={PORTFOLIO_CATEGORIES.map((c) => ({ value: c as string, label: c }))}
              />
            </div>
            <Textarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <Toggle label="Featured" description="Featured frames get priority placement in the editorial grid." checked={draft.featured} onChange={(v) => setDraft({ ...draft, featured: v })} />
            <Toggle label="Active" description="Hidden photographs stay in the archive but leave the public site." checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
          </div>
        )}
      </Dialog>

      <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ""} size="lg" description={preview ? `${preview.category} · ${preview.location ?? ""}` : undefined}>
        {preview && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.image.src} alt={preview.image.alt} width={preview.image.width} height={preview.image.height} className="w-full rounded-[10px] object-cover" />
            <figcaption className="mt-4 text-[13px] leading-relaxed text-muted">{preview.description}</figcaption>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
              <Meta label="Width" value={`${preview.image.width}px`} />
              <Meta label="Height" value={`${preview.image.height}px`} />
              <Meta label="Created" value={formatDate(preview.createdAt, "short")} />
              <Meta label="Updated" value={formatDate(preview.updatedAt, "short")} />
            </dl>
          </figure>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={busy}
        tone="danger"
        confirmLabel="Delete photograph"
        title="Delete this photograph?"
        message={`“${toDelete?.title}” and its stored media will be removed from the archive.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await mutate(() => api.del(`/api/admin/portfolio/${toDelete.id}`), "Photograph deleted");
          setToDelete(null);
        }}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-white/8 bg-white/[0.02] p-2.5">
      <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[12.5px] text-bone">{value}</dd>
    </div>
  );
}
