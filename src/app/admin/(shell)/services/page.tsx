"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useApi, api, ApiFailure, type ServiceDTO } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { ActiveDot, DataTable, PageIntro, ReorderControls, Toolbar, type Column } from "@/components/admin/parts";
import { Button, EmptyState, ErrorState, IconButton, Input, Textarea, Toggle } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog, useToast } from "@/components/ui/overlays";

interface Draft {
  id: string;
  name: string;
  description: string;
  price: number;
  priceNote: string;
  active: boolean;
  displayOrder: number;
}

const EMPTY: Draft = { id: "", name: "", description: "", price: 0, priceNote: "starting", active: true, displayOrder: 99 };

export default function AdminServicesPage() {
  const { data, loading, error, refetch } = useApi<{ services: ServiceDTO[] }>("/api/admin/services");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preview, setPreview] = useState<ServiceDTO | null>(null);
  const [toDelete, setToDelete] = useState<ServiceDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.services ?? []).filter((s) => !q || `${s.name} ${s.description}`.toLowerCase().includes(q));
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

  async function move(s: ServiceDTO, dir: -1 | 1) {
    const list = data?.services ?? [];
    const i = list.findIndex((x) => x.id === s.id);
    const other = list[i + dir];
    if (!other) return;
    await mutate(
      () =>
        Promise.all([
          api.patch(`/api/admin/services/${s.id}`, { displayOrder: other.displayOrder }),
          api.patch(`/api/admin/services/${other.id}`, { displayOrder: s.displayOrder }),
        ]),
      "Order updated",
    );
  }

  async function save() {
    if (!draft) return;
    const body = {
      name: draft.name,
      description: draft.description,
      price: draft.price,
      priceNote: draft.priceNote,
      active: draft.active,
      displayOrder: draft.displayOrder,
    };
    const okDone = draft.id
      ? await mutate(() => api.patch(`/api/admin/services/${draft.id}`, body), "Service updated")
      : await mutate(() => api.post("/api/admin/services", body), "Service created");
    if (okDone) setDraft(null);
  }

  const columns: Column<ServiceDTO>[] = [
    {
      key: "order",
      header: "Order",
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">{String(s.displayOrder).padStart(2, "0")}</span>
          <ReorderControls onUp={() => move(s, -1)} onDown={() => move(s, 1)} />
        </div>
      ),
    },
    {
      key: "name",
      header: "Service",
      render: (s) => (
        <div className="max-w-sm">
          <p className="text-[13px] text-bone">{s.name}</p>
          <p className="line-clamp-1 text-[11.5px] text-muted">{s.description}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Displayed price",
      render: (s) => (
        <div>
          <p className="font-mono text-[12.5px] text-bone">{formatINR(s.price)}</p>
          <p className="text-[11px] text-muted">{s.priceNote}</p>
        </div>
      ),
    },
    { key: "active", header: "Status", render: (s) => <ActiveDot active={s.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (s) => (
        <span className="inline-flex items-center gap-1">
          <IconButton label="Preview" icon={Eye} size="sm" variant="ghost" onClick={() => setPreview(s)} />
          <IconButton
            label="Edit"
            icon={Pencil}
            size="sm"
            variant="ghost"
            onClick={() =>
              setDraft({
                id: s.id,
                name: s.name,
                description: s.description,
                price: s.price,
                priceNote: s.priceNote,
                active: s.active,
                displayOrder: s.displayOrder,
              })
            }
          />
          <IconButton label="Delete" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(s)} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageIntro
        title="Services"
        description="The public catalogue. Prices here are the only prices the booking engine will accept."
        actions={
          <Button size="sm" variant="accent" icon={Plus} onClick={() => setDraft({ ...EMPTY })}>
            New service
          </Button>
        }
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search services" />

      {error ? (
        <ErrorState title="Services unavailable" description={error.message} onRetry={refetch} />
      ) : (
        <DataTable
          rows={items}
          columns={columns}
          loading={loading}
          empty={
            <EmptyState
              icon={Sparkles}
              title="No services yet"
              description="Create your first service to make it bookable on the public website."
              action={
                <Button size="sm" variant="accent" icon={Plus} onClick={() => setDraft({ ...EMPTY })}>
                  New service
                </Button>
              }
            />
          }
        />
      )}

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit service" : "New service"}
        description="Saved directly to the studio database and reflected on the public site."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="accent" size="sm" loading={busy} onClick={save}>Save service</Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <Input label="Service name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Textarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Displayed price (₹)"
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              />
              <Input label="Price note" value={draft.priceNote} onChange={(e) => setDraft({ ...draft, priceNote: e.target.value })} />
            </div>
            <Toggle
              label="Active on the website"
              description="Inactive services are hidden from the public site and the booking flow."
              checked={draft.active}
              onChange={(v) => setDraft({ ...draft, active: v })}
            />
          </div>
        )}
      </Dialog>

      <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? ""} description="Public presentation preview.">
        {preview && (
          <div className="rounded-[14px] border border-white/8 bg-white/[0.02] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">{preview.category}</p>
            <h3 className="display mt-2 text-[28px] text-bone">{preview.name}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{preview.description}</p>
            <ul className="mt-4 space-y-1.5">
              {preview.details.map((d) => (
                <li key={d} className="text-[12.5px] text-bone/85">· {d}</li>
              ))}
            </ul>
            <p className="display mt-5 text-[26px] text-bone">{formatINR(preview.price)}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{preview.priceNote}</p>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={busy}
        tone="danger"
        confirmLabel="Delete service"
        title="Delete this service?"
        message={`“${toDelete?.name}” will be removed. If historical bookings reference it, the service is deactivated instead so past bookings stay readable.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await mutate(() => api.del(`/api/admin/services/${toDelete.id}`), "Service removed");
          setToDelete(null);
        }}
      />
    </div>
  );
}
