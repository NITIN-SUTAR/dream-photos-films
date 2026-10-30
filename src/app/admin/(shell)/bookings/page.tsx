"use client";

import { useMemo, useState } from "react";
import { CalendarX2, Check, Inbox, X } from "lucide-react";
import {
  api,
  ApiFailure,
  useApi,
  type AdminBookingDetail,
  type AdminBookingRow,
  type BookingView,
  type ServiceDTO,
} from "@/lib/api";
import { formatDate, formatDateRange, formatINR, relativeTime } from "@/lib/utils";
import { DataTable, FilterChips, PageIntro, Toolbar, type Column } from "@/components/admin/parts";
import { Button, EmptyState, ErrorState, StatusIndicator } from "@/components/ui/primitives";
import { ConfirmDialog, Drawer, useToast } from "@/components/ui/overlays";

type StatusFilter = "ALL" | BookingView["status"];

export default function AdminBookingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [serviceId, setServiceId] = useState("all");
  const [openNumber, setOpenNumber] = useState<string | null>(null);
  const [action, setAction] = useState<null | "confirm" | "reject" | "cancel">(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (status !== "ALL") p.set("status", status);
    if (serviceId !== "all") p.set("serviceId", serviceId);
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [status, serviceId, search]);

  const { data, loading, error, refetch } = useApi<{ bookings: AdminBookingRow[] }>(
    `/api/admin/bookings${query ? `?${query}` : ""}`,
    [query],
  );
  const { data: catalog } = useApi<{ services: ServiceDTO[] }>("/api/admin/services");
  const { data: detail, refetch: refetchDetail } = useApi<AdminBookingDetail>(
    openNumber ? `/api/admin/bookings/${openNumber}` : null,
    [openNumber],
  );

  const rows = data?.bookings ?? [];

  async function applyAction() {
    if (!openNumber || !action) return;
    setBusy(true);
    try {
      await api.post(`/api/admin/bookings/${openNumber}/status`, { action });
      await Promise.all([refetch(), refetchDetail()]);
      push({
        tone: action === "reject" ? "error" : "success",
        title: `Booking ${action === "confirm" ? "confirmed" : action === "reject" ? "rejected" : "cancelled"}`,
        description: "The calendar and client notifications were updated.",
      });
    } catch (err) {
      push({ tone: "error", title: "Action failed", description: (err as ApiFailure).message });
    } finally {
      setBusy(false);
      setAction(null);
    }
  }

  const columns: Column<AdminBookingRow>[] = [
    {
      key: "number",
      header: "Booking",
      render: (b) => (
        <div>
          <p className="font-mono text-[11.5px] text-accent">{b.bookingNumber}</p>
          <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
            {relativeTime(b.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (b) => (
        <div>
          <p className="text-[13px] text-bone">{b.clientName}</p>
          <p className="text-[11.5px] text-muted">{b.city}</p>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service / package",
      render: (b) => (
        <div>
          <p className="text-[13px] text-bone">{b.serviceName}</p>
          <p className="text-[11.5px] text-muted">{b.packageName ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      render: (b) => <span className="text-[12.5px] text-bone">{formatDateRange(b.dates)}</span>,
    },
    {
      key: "estimate",
      header: "Estimate",
      className: "text-right",
      render: (b) => <span className="font-mono text-[12.5px] text-bone">{formatINR(b.estimate)}</span>,
    },
    { key: "status", header: "Status", render: (b) => <StatusIndicator status={b.status} size="sm" /> },
  ];

  const counts = (s: StatusFilter) =>
    s === "ALL" ? rows.length : rows.filter((b) => b.status === s).length;

  return (
    <div>
      <PageIntro
        title="Bookings"
        description="Every request received through the public booking flow. Decisions are recorded in the database with a full status history."
      />

      <Toolbar search={search} onSearch={setSearch} placeholder="Search by booking number, client, phone or city">
        <select
          aria-label="Filter by service"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="h-10 rounded-[10px] border border-white/10 bg-white/[0.03] px-3 text-[12.5px] text-bone focus:border-accent/50 focus:outline-none"
        >
          <option value="all" className="bg-ink-2">All services</option>
          {(catalog?.services ?? []).map((s) => (
            <option key={s.id} value={s.id} className="bg-ink-2">{s.name}</option>
          ))}
        </select>
      </Toolbar>

      <div className="mb-4">
        <FilterChips<StatusFilter>
          label="Filter by status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "ALL", label: "All", count: counts("ALL") },
            { value: "PENDING", label: "Pending" },
            { value: "CONFIRMED", label: "Confirmed" },
            { value: "REJECTED", label: "Rejected" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "EXPIRED", label: "Expired" },
          ]}
        />
      </div>

      {error ? (
        <ErrorState title="Bookings unavailable" description={error.message} onRetry={refetch} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(b) => setOpenNumber(b.bookingNumber)}
          empty={
            <EmptyState
              icon={Inbox}
              title="No bookings match those filters"
              description="Try clearing the search field or switching back to all statuses."
            />
          }
        />
      )}

      <Drawer
        open={!!openNumber}
        onClose={() => setOpenNumber(null)}
        title={openNumber ?? "Booking"}
        footer={
          detail && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="accent" icon={Check} disabled={detail.status !== "PENDING"} onClick={() => setAction("confirm")}>
                Confirm
              </Button>
              <Button size="sm" variant="danger" icon={X} disabled={detail.status !== "PENDING"} onClick={() => setAction("reject")}>
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={CalendarX2}
                disabled={!["PENDING", "CONFIRMED"].includes(detail.status)}
                onClick={() => setAction("cancel")}
              >
                Cancel
              </Button>
            </div>
          )
        }
      >
        {detail ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StatusIndicator status={detail.status} />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                Created {formatDate(detail.createdAt, "short")}
              </span>
            </div>

            <section>
              <h3 className="eyebrow">Client</h3>
              <dl className="mt-3 space-y-2 text-[13px]">
                <Row label="Name" value={detail.clientName} />
                <Row label="Phone" value={detail.clientPhone} />
                <Row label="Email" value={detail.clientEmail} />
                <Row label="District" value={detail.district} />
                <Row label="City / venue" value={detail.city} />
                <Row label="Budget" value={detail.budget || "—"} />
              </dl>
            </section>

            <section>
              <h3 className="eyebrow">Coverage</h3>
              <dl className="mt-3 space-y-2 text-[13px]">
                <Row label="Service" value={detail.serviceName} />
                <Row label="Package" value={detail.packageName ?? "—"} />
                <Row label="Album" value={detail.album ?? "—"} />
                <Row label="Dates" value={formatDateRange(detail.dates)} />
                {detail.expiresAt && detail.status === "PENDING" && (
                  <Row label="Hold expires" value={new Date(detail.expiresAt).toLocaleString()} />
                )}
              </dl>
            </section>

            <section>
              <h3 className="eyebrow">Extras</h3>
              {detail.extras.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-muted">None selected.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {detail.extras.map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-[8px] border border-white/8 bg-white/[0.02] px-3 py-2 text-[12.5px]">
                      <span className="text-bone">{e.name}</span>
                      <span className="font-mono text-[11px] text-muted">{formatINR(e.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[12px] border border-accent/25 bg-accent/[0.06] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Estimate</p>
              <p className="display mt-1 text-[28px] text-bone">{formatINR(detail.estimate)}</p>
              <p className="mt-1 text-[11.5px] text-muted">
                Base {formatINR(detail.baseAmount)} + extras {formatINR(detail.extrasAmount)}
              </p>
            </section>

            {detail.notes && (
              <section>
                <h3 className="eyebrow">Client notes</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{detail.notes}</p>
              </section>
            )}

            <section>
              <h3 className="eyebrow">Status timeline</h3>
              <ol className="mt-4">
                {detail.timeline.map((t, i) => (
                  <li key={t.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {i !== detail.timeline.length - 1 && (
                      <span aria-hidden className="absolute left-[5px] top-3 h-full w-px bg-white/10" />
                    )}
                    <span aria-hidden className="relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-accent/50 bg-ink" />
                    <div>
                      <p className="text-[12.5px] text-bone">{t.label}</p>
                      <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
                        {formatDate(t.at, "short")}
                      </p>
                      {t.note && <p className="mt-1 text-[12px] text-muted">{t.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : (
          <p className="text-[13px] text-muted">Loading booking…</p>
        )}
      </Drawer>

      <ConfirmDialog
        open={action !== null}
        onClose={() => setAction(null)}
        onConfirm={applyAction}
        loading={busy}
        title={
          action === "confirm" ? "Confirm this booking?" : action === "reject" ? "Reject this request?" : "Cancel this booking?"
        }
        message={
          action === "confirm"
            ? "The dates will be committed in the studio calendar and the client will be notified."
            : action === "reject"
              ? "The dates will be released and the client will be told we could not accept the request."
              : "The dates will be released back into the availability pool."
        }
        confirmLabel={action === "confirm" ? "Confirm booking" : "Yes, continue"}
        tone={action === "confirm" ? "default" : "danger"}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/6 pb-2">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right text-bone">{value}</dd>
    </div>
  );
}
