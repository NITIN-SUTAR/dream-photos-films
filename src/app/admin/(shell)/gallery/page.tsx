"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Images, Plus, Trash2 } from "lucide-react";
import { api, ApiFailure, useApi } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { ActiveDot, PageIntro, UploadPanel } from "@/components/admin/parts";
import { Button, EmptyState, ErrorState, IconButton, Input, LoadingSkeleton, Toggle } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog, useToast } from "@/components/ui/overlays";

interface AlbumRow {
  id: string;
  slug: string;
  title: string;
  client: string;
  event: string;
  date: string;
  location: string;
  cover: { src: string; alt: string } | null;
  active: boolean;
  photoCount: number;
}

interface PhotoRow {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  displayOrder: number;
  active: boolean;
}

export default function AdminGalleryPage() {
  const { data, loading, error, refetch } = useApi<{ albums: AlbumRow[] }>("/api/admin/gallery-albums");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<PhotoRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: "", client: "", event: "", location: "", date: "" });
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const albums = data?.albums ?? [];
  const album = albums.find((a) => a.id === activeId) ?? albums[0] ?? null;

  const { data: photoData, refetch: refetchPhotos } = useApi<{ photos: PhotoRow[] }>(
    album ? `/api/admin/gallery-albums/${album.id}/photos` : null,
    [album?.id],
  );
  const photos = photoData?.photos ?? [];

  async function mutate(fn: () => Promise<unknown>, title: string) {
    setBusy(true);
    try {
      await fn();
      await Promise.all([refetch(), refetchPhotos()]);
      push({ tone: "success", title });
      return true;
    } catch (err) {
      push({ tone: "error", title: "That did not save", description: (err as ApiFailure).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function movePhoto(photo: PhotoRow, dir: -1 | 1) {
    const i = photos.findIndex((p) => p.id === photo.id);
    const other = photos[i + dir];
    if (!other) return;
    await mutate(
      () =>
        Promise.all([
          api.patch(`/api/admin/gallery-photos/${photo.id}`, { displayOrder: other.displayOrder }),
          api.patch(`/api/admin/gallery-photos/${other.id}`, { displayOrder: photo.displayOrder }),
        ]),
      "Order updated",
    );
  }

  return (
    <div>
      <PageIntro
        title="Client gallery"
        description="Private delivery albums stored in the private bucket. Photographs are served through short-lived signed links."
        actions={
          <Button size="sm" variant="accent" icon={Plus} onClick={() => setCreating(true)}>
            New album
          </Button>
        }
      />

      {error ? (
        <ErrorState title="Galleries unavailable" description={error.message} onRetry={refetch} />
      ) : loading ? (
        <LoadingSkeleton className="h-72 w-full" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[280px_1fr] xl:items-start">
          <section className="rounded-[14px] panel p-4" aria-label="Albums">
            <p className="eyebrow mb-3">Albums</p>
            {albums.length === 0 ? (
              <p className="text-[12.5px] text-muted">No albums yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {albums.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(a.id)}
                      aria-current={a.id === album?.id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[10px] border p-2.5 text-left transition-all duration-300",
                        a.id === album?.id ? "border-accent/45 bg-accent/[0.08]" : "border-white/8 bg-white/[0.02] hover:border-white/20",
                      )}
                    >
                      {a.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.cover.src} alt="" width={48} height={48} loading="lazy" className="h-11 w-11 shrink-0 rounded-[8px] object-cover" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-bone">{a.title}</span>
                        <span className="block truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
                          {a.photoCount} frames
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!album ? (
            <EmptyState icon={Images} title="No albums yet" description="Create an album to deliver a private gallery to a client." />
          ) : (
            <div className="space-y-4">
              <section className="rounded-[14px] panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">{album.event}</p>
                    <h3 className="display mt-1.5 text-[26px] text-bone">{album.title}</h3>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {album.client} · {album.date ? formatDate(album.date) : "No date"} · {album.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ActiveDot active={album.active} />
                    <a
                      href={`/gallery/${album.slug}`}
                      className="inline-flex h-9 items-center rounded-full border border-white/12 px-4 text-[12.5px] text-bone transition-colors hover:border-accent/40 hover:text-accent-soft"
                    >
                      View public gallery
                    </a>
                  </div>
                </div>
                <div className="mt-4 max-w-md border-t border-white/8 pt-3">
                  <Toggle
                    label="Gallery is live for the client"
                    description="Turn off to hide the gallery while you finish the edit."
                    checked={album.active}
                    onChange={(v) => mutate(() => api.patch(`/api/admin/gallery-albums/${album.id}`, { active: v }), "Gallery updated")}
                  />
                </div>
              </section>

              <section className="rounded-[14px] panel p-5">
                <UploadPanel
                  scope="gallery"
                  kind="IMAGE"
                  label="Drag photographs into this album"
                  hint="Stored privately — delivered to clients through signed links."
                  onReady={(asset) =>
                    mutate(
                      () =>
                        api.post(`/api/admin/gallery-albums/${album.id}/photos`, {
                          assetId: asset.assetId,
                          storagePath: asset.storagePath,
                          alt: `${album.title} photograph`,
                          width: asset.width ?? 1200,
                          height: asset.height ?? 800,
                          displayOrder: photos.length + 1,
                        }),
                      "Photograph added",
                    )
                  }
                />
              </section>

              <section className="rounded-[14px] panel p-5" aria-label="Photographs">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[14px] text-bone">
                    Photographs <span className="font-mono text-[11px] text-muted">({photos.length})</span>
                  </h3>
                </div>
                {photos.length === 0 ? (
                  <p className="text-[12.5px] text-muted">This album has no photographs yet.</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {photos.map((p) => (
                      <li key={p.id} className="group relative overflow-hidden rounded-[10px] border border-white/8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.src} alt={p.alt} width={p.width} height={p.height} loading="lazy" className="aspect-square w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/80 px-1.5 py-1 opacity-0 backdrop-blur transition-opacity duration-300 focus-within:opacity-100 group-hover:opacity-100">
                          <span className="flex">
                            <IconButton label="Move earlier" icon={ArrowLeft} size="sm" variant="ghost" onClick={() => movePhoto(p, -1)} />
                            <IconButton label="Move later" icon={ArrowRight} size="sm" variant="ghost" onClick={() => movePhoto(p, 1)} />
                          </span>
                          <IconButton label="Delete frame" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(p)} />
                        </div>
                        <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-1.5 py-0.5 font-mono text-[9px] text-bone backdrop-blur">
                          {String(p.displayOrder).padStart(2, "0")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New client album"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              variant="accent"
              size="sm"
              loading={busy}
              disabled={!newAlbum.title}
              onClick={async () => {
                const done = await mutate(() => api.post("/api/admin/gallery-albums", newAlbum), "Album created");
                if (done) {
                  setCreating(false);
                  setNewAlbum({ title: "", client: "", event: "", location: "", date: "" });
                }
              }}
            >
              Create album
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Album title" value={newAlbum.title} onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })} />
          <Input label="Client" value={newAlbum.client} onChange={(e) => setNewAlbum({ ...newAlbum, client: e.target.value })} />
          <Input label="Event" value={newAlbum.event} onChange={(e) => setNewAlbum({ ...newAlbum, event: e.target.value })} />
          <Input label="Location" value={newAlbum.location} onChange={(e) => setNewAlbum({ ...newAlbum, location: e.target.value })} />
          <Input label="Event date" type="date" value={newAlbum.date} onChange={(e) => setNewAlbum({ ...newAlbum, date: e.target.value })} />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={busy}
        tone="danger"
        confirmLabel="Delete frame"
        title="Remove this frame?"
        message="The photograph and its stored file will be removed from the client gallery."
        onConfirm={async () => {
          if (!toDelete) return;
          await mutate(() => api.del(`/api/admin/gallery-photos/${toDelete.id}`), "Frame removed");
          setToDelete(null);
        }}
      />
    </div>
  );
}
