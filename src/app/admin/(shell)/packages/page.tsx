"use client";

import { useMemo, useState } from "react";
import { Check, Eye, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiFailure, useApi, type PackageDTO, type ServiceDTO } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";
import { ActiveDot, PageIntro, ReorderControls, Toolbar } from "@/components/admin/parts";
import { Button, EmptyState, ErrorState, IconButton, Input, LoadingSkeleton, Select, Textarea, Toggle } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog, useToast } from "@/components/ui/overlays";

interface Draft {
  id: string;
  code: string;
  name: string;
  serviceId: string;
  description: string;
  inclusions: string;
  withAlbum: number;
  withoutAlbum: number;
  active: boolean;
}

export default function AdminPackagesPage() {
  const { data, loading, error, refetch } = useApi<{ packages: PackageDTO[]; services: ServiceDTO[] }>(
    "/api/admin/packages",
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preview, setPreview] = useState<PackageDTO | null>(null);
  const [toDelete, setToDelete] = useState<PackageDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const price = (p: PackageDTO, album: boolean) =>
    p.options.find((o) => o.kind === (album ? "WITH_ALBUM" : "WITHOUT_ALBUM"))?.price ?? 0;

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.packages ?? []).filter(
      (p) => !q || `${p.code} ${p.name} ${p.inclusions.join(" ")}`.toLowerCase().includes(q),
    );
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

  async function move(p: PackageDTO, dir: -1 | 1) {
    const list = data?.packages ?? [];
    const i = list.findIndex((x) => x.id === p.id);
    const other = list[i + dir];
    if (!other) return;
    await mutate(
      () =>
        Promise.all([
          api.patch(`/api/admin/packages/${p.id}`, { displayOrder: other.displayOrder }),
          api.patch(`/api/admin/packages/${other.id}`, { displayOrder: p.displayOrder }),
        ]),
      "Order updated",
    );
  }

  async function save() {
    if (!draft) return;
    const body = {
      code: draft.code,
      name: draft.name,
      serviceId: draft.serviceId,
      description: draft.description,
      inclusions: draft.inclusions.split("\n").map((l) => l.trim()).filter(Boolean),
      withAlbum: draft.withAlbum,
      withoutAlbum: draft.withoutAlbum,
      active: draft.active,
    };
    const done = draft.id
      ? await mutate(() => api.patch(`/api/admin/packages/${draft.id}`, body), "Package updated")
      : await mutate(() => api.post("/api/admin/packages", body), "Package created");
    if (done) setDraft(null);
  }

  return (
    <div>
      <PageIntro
        title="Packages"
        description="Bundled coverage with album options. The booking engine prices every request from these records."
        actions={
          <Button
            size="sm"
            variant="accent"
            icon={Plus}
            onClick={() =>
              setDraft({
                id: "",
                code: `PACKAGE 0${(data?.packages.length ?? 0) + 1}`,
                name: "",
                serviceId: data?.services[0]?.id ?? "",
                description: "",
                inclusions: "",
                withAlbum: 0,
                withoutAlbum: 0,
                active: true,
              })
            }
          >
            New package
          </Button>
        }
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search packages or inclusions" />

      {error ? (
        <ErrorState title="Packages unavailable" description={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Package} title="No packages yet" description="Create a package to offer bundled coverage with an album option." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-3">
          {items.map((p) => (
            <li
              key={p.id}
              className={cn(
                "flex flex-col rounded-[14px] panel p-5 transition-colors duration-300 hover:border-white/18",
                !p.active && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">{p.code}</span>
                <ActiveDot active={p.active} />
              </div>
              <h3 className="display mt-2 text-[24px] text-bone">{p.name}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{p.description}</p>
              <ul className="mt-4 flex-1 space-y-1.5 border-t border-white/8 pt-4">
                {p.inclusions.map((inc) => (
                  <li key={inc} className="flex items-start gap-2 text-[12.5px] text-bone/85">
                    <Check aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                    {inc}
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-white/8 pt-4 text-[12.5px]">
                <div>
                  <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">With album</dt>
                  <dd className="mt-0.5 text-bone">{formatINR(price(p, true))}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">Without album</dt>
                  <dd className="mt-0.5 text-bone">{formatINR(price(p, false))}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                <ReorderControls onUp={() => move(p, -1)} onDown={() => move(p, 1)} />
                <span className="flex items-center gap-1">
                  <IconButton label="Preview" icon={Eye} size="sm" variant="ghost" onClick={() => setPreview(p)} />
                  <IconButton
                    label="Edit"
                    icon={Pencil}
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        code: p.code,
                        name: p.name,
                        serviceId: p.serviceId,
                        description: p.description,
                        inclusions: p.inclusions.join("\n"),
                        withAlbum: price(p, true),
                        withoutAlbum: price(p, false),
                        active: p.active,
                      })
                    }
                  />
                  <IconButton label="Delete" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(p)} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit package" : "New package"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="accent" size="sm" loading={busy} onClick={save}>Save package</Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Package code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            <Input label="Package name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Select
              label="Service"
              value={draft.serviceId}
              options={(data?.services ?? []).map((s) => ({ value: s.id, label: s.name }))}
              onChange={(e) => setDraft({ ...draft, serviceId: e.target.value })}
            />
            <Input
              label="Price with album (₹)"
              type="number"
              min={0}
              value={draft.withAlbum}
              onChange={(e) => setDraft({ ...draft, withAlbum: Number(e.target.value) })}
            />
            <Input
              label="Price without album (₹)"
              type="number"
              min={0}
              value={draft.withoutAlbum}
              onChange={(e) => setDraft({ ...draft, withoutAlbum: Number(e.target.value) })}
            />
            <div className="sm:col-span-2">
              <Textarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Inclusions (one per line)"
                value={draft.inclusions}
                hint="Each line becomes a bullet in the public package card."
                onChange={(e) => setDraft({ ...draft, inclusions: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Toggle
                label="Active"
                description="Inactive packages are hidden from the website and booking flow."
                checked={draft.active}
                onChange={(v) => setDraft({ ...draft, active: v })}
              />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview ? `${preview.code} — ${preview.name}` : ""}>
        {preview && (
          <div className="rounded-[14px] border border-accent/35 bg-gradient-to-b from-accent/[0.08] to-transparent p-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">{preview.code}</span>
            <h3 className="display mt-2 text-[26px] text-bone">{preview.name}</h3>
            <ul className="mt-4 space-y-1.5">
              {preview.inclusions.map((i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-bone/85">
                  <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-6 border-t border-white/10 pt-4">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">With album</p>
                <p className="display text-[24px] text-bone">{formatINR(price(preview, true))}</p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">Without album</p>
                <p className="display text-[24px] text-bone">{formatINR(price(preview, false))}</p>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={busy}
        tone="danger"
        confirmLabel="Delete package"
        title="Delete this package?"
        message={`“${toDelete?.name}” will be removed, or deactivated automatically if historical bookings reference it.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await mutate(() => api.del(`/api/admin/packages/${toDelete.id}`), "Package removed");
          setToDelete(null);
        }}
      />
    </div>
  );
}
