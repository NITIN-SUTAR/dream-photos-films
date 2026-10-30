"use client";

import { useMemo, useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiFailure, useApi, type ExtraDTO, type ServiceDTO } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { ActiveDot, DataTable, FilterChips, PageIntro, ReorderControls, Toolbar, type Column } from "@/components/admin/parts";
import { Badge, Button, EmptyState, ErrorState, IconButton, Input, Select, Textarea, Toggle } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog, useToast } from "@/components/ui/overlays";

type GroupFilter = "All" | "Albums" | "Digital Deliverables" | "Additional Services";

interface Draft {
  id: string;
  name: string;
  description: string;
  price: number;
  group: string;
  serviceIds: string[];
  active: boolean;
}

export default function AdminExtrasPage() {
  const { data, loading, error, refetch } = useApi<{ extras: ExtraDTO[]; services: ServiceDTO[] }>("/api/admin/extras");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<GroupFilter>("All");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<ExtraDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.extras ?? [])
      .filter((e) => group === "All" || e.group === group)
      .filter((e) => !q || `${e.name} ${e.description}`.toLowerCase().includes(q));
  }, [data, search, group]);

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

  async function move(e: ExtraDTO, dir: -1 | 1) {
    const list = data?.extras ?? [];
    const i = list.findIndex((x) => x.id === e.id);
    const other = list[i + dir];
    if (!other) return;
    await mutate(
      () =>
        Promise.all([
          api.patch(`/api/admin/extras/${e.id}`, { displayOrder: other.displayOrder }),
          api.patch(`/api/admin/extras/${other.id}`, { displayOrder: e.displayOrder }),
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
      group: draft.group,
      serviceIds: draft.serviceIds,
      active: draft.active,
    };
    const done = draft.id
      ? await mutate(() => api.patch(`/api/admin/extras/${draft.id}`, body), "Extra updated")
      : await mutate(() => api.post("/api/admin/extras", body), "Extra created");
    if (done) setDraft(null);
  }

  const columns: Column<ExtraDTO>[] = [
    {
      key: "order",
      header: "Order",
      render: (e) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted">{String(e.displayOrder).padStart(2, "0")}</span>
          <ReorderControls onUp={() => move(e, -1)} onDown={() => move(e, 1)} />
        </div>
      ),
    },
    {
      key: "name",
      header: "Extra",
      render: (e) => (
        <div className="max-w-sm">
          <p className="text-[13px] text-bone">{e.name}</p>
          <p className="line-clamp-1 text-[11.5px] text-muted">{e.description}</p>
        </div>
      ),
    },
    { key: "group", header: "Group", render: (e) => <Badge>{e.group}</Badge> },
    {
      key: "applies",
      header: "Applies to",
      render: (e) => (
        <span className="text-[11.5px] text-muted">
          {e.serviceIds
            .map((id) => data?.services.find((s) => s.id === id)?.name ?? "—")
            .slice(0, 2)
            .join(", ")}
          {e.serviceIds.length > 2 ? ` +${e.serviceIds.length - 2}` : ""}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      className: "text-right",
      render: (e) => <span className="font-mono text-[12.5px] text-bone">{formatINR(e.price)}</span>,
    },
    { key: "active", header: "Status", render: (e) => <ActiveDot active={e.active} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (e) => (
        <span className="inline-flex items-center gap-1">
          <IconButton
            label="Edit"
            icon={Pencil}
            size="sm"
            variant="ghost"
            onClick={() =>
              setDraft({
                id: e.id,
                name: e.name,
                description: e.description,
                price: e.price,
                group: e.group,
                serviceIds: e.serviceIds,
                active: e.active,
              })
            }
          />
          <IconButton label="Delete" icon={Trash2} size="sm" variant="ghost" onClick={() => setToDelete(e)} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageIntro
        title="Extras"
        description="Optional add-ons. The booking engine only accepts extras that are active and linked to the chosen service."
        actions={
          <Button
            size="sm"
            variant="accent"
            icon={Plus}
            onClick={() =>
              setDraft({
                id: "",
                name: "",
                description: "",
                price: 0,
                group: "Additional Services",
                serviceIds: data?.services[0] ? [data.services[0].id] : [],
                active: true,
              })
            }
          >
            New extra
          </Button>
        }
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search extras">
        <FilterChips<GroupFilter>
          label="Filter by group"
          value={group}
          onChange={setGroup}
          options={[
            { value: "All", label: "All" },
            { value: "Albums", label: "Albums" },
            { value: "Digital Deliverables", label: "Digital" },
            { value: "Additional Services", label: "Services" },
          ]}
        />
      </Toolbar>

      {error ? (
        <ErrorState title="Extras unavailable" description={error.message} onRetry={refetch} />
      ) : (
        <DataTable
          rows={items}
          columns={columns}
          loading={loading}
          empty={<EmptyState icon={Layers} title="No extras in this group" description="Add an extra to offer albums, deliverables or additional crew." />}
        />
      )}

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit extra" : "New extra"}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="accent" size="sm" loading={busy} onClick={save}>Save extra</Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <Input label="Name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Textarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Price (₹)"
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              />
              <Select
                label="Group"
                value={draft.group}
                options={[
                  { value: "Albums", label: "Albums" },
                  { value: "Digital Deliverables", label: "Digital Deliverables" },
                  { value: "Additional Services", label: "Additional Services" },
                ]}
                onChange={(e) => setDraft({ ...draft, group: e.target.value })}
              />
            </div>
            <fieldset>
              <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                Associated services
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {(data?.services ?? []).map((s) => {
                  const on = draft.serviceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          serviceIds: on
                            ? draft.serviceIds.filter((id) => id !== s.id)
                            : [...draft.serviceIds, s.id],
                        })
                      }
                      className={
                        on
                          ? "rounded-full border border-accent/50 bg-accent/12 px-3 py-1.5 text-[12px] text-accent-soft"
                          : "rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-muted hover:border-white/25 hover:text-bone"
                      }
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Toggle label="Active" description="Inactive extras are hidden from the booking flow." checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={busy}
        tone="danger"
        confirmLabel="Delete extra"
        title="Delete this extra?"
        message={`“${toDelete?.name}” will be removed, or deactivated if past bookings reference it.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await mutate(() => api.del(`/api/admin/extras/${toDelete.id}`), "Extra removed");
          setToDelete(null);
        }}
      />
    </div>
  );
}
