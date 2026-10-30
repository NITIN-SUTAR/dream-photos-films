"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, UserSearch } from "lucide-react";
import { useApi, type AdminBookingRow, type ClientRow } from "@/lib/api";
import { formatDateRange, formatINR } from "@/lib/utils";
import { DataTable, PageIntro, Toolbar, type Column } from "@/components/admin/parts";
import { Badge, EmptyState, ErrorState, StatusIndicator } from "@/components/ui/primitives";
import { Drawer } from "@/components/ui/overlays";

interface ClientDetailPayload extends ClientRow {
  bookings: AdminBookingRow[];
}

export default function AdminClientsPage() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useApi<{ clients: ClientRow[] }>(
    `/api/admin/clients${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`,
    [search],
  );
  const { data: detail } = useApi<ClientDetailPayload>(
    openId ? `/api/admin/clients/${openId}` : null,
    [openId],
  );

  const columns: Column<ClientRow>[] = [
    {
      key: "name",
      header: "Client",
      render: (c) => (
        <div>
          <p className="text-[13px] text-bone">{c.name}</p>
          <p className="text-[11.5px] text-muted">{c.email}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (c) => <span className="font-mono text-[12px] text-muted">{c.phone}</span> },
    {
      key: "location",
      header: "Location",
      render: (c) => (
        <div>
          <p className="text-[12.5px] text-bone">{c.city}</p>
          <p className="text-[11.5px] text-muted">{c.district}</p>
        </div>
      ),
    },
    { key: "bookings", header: "Bookings", render: (c) => <span className="font-mono text-[12.5px] text-bone">{c.bookingCount}</span> },
    {
      key: "latest",
      header: "Latest booking",
      render: (c) => <span className="font-mono text-[11.5px] text-accent">{c.latestBooking ?? "—"}</span>,
    },
    {
      key: "value",
      header: "Confirmed value",
      className: "text-right",
      render: (c) => <span className="font-mono text-[12.5px] text-bone">{formatINR(c.lifetimeValue)}</span>,
    },
  ];

  return (
    <div>
      <PageIntro
        title="Clients"
        description="A lightweight CRM built from real booking history — contact details, service history and value."
      />
      <Toolbar search={search} onSearch={setSearch} placeholder="Search clients by name, email, phone or city" />

      {error ? (
        <ErrorState title="Clients unavailable" description={error.message} onRetry={refetch} />
      ) : (
        <DataTable
          rows={data?.clients ?? []}
          columns={columns}
          loading={loading}
          onRowClick={(c) => setOpenId(c.id)}
          empty={
            <EmptyState
              icon={UserSearch}
              title="No clients found"
              description="Clients appear here as soon as their first booking request is submitted."
            />
          }
        />
      )}

      <Drawer open={!!openId} onClose={() => setOpenId(null)} title={detail?.name ?? "Client"}>
        {detail ? (
          <div className="space-y-6">
            <section>
              <h3 className="eyebrow">Contact</h3>
              <ul className="mt-3 space-y-2.5 text-[13px]">
                <li className="flex items-center gap-2.5">
                  <Phone aria-hidden className="h-3.5 w-3.5 text-accent" />
                  <a href={`tel:${detail.phone}`} className="text-bone hover:text-accent-soft">{detail.phone}</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail aria-hidden className="h-3.5 w-3.5 text-accent" />
                  <a href={`mailto:${detail.email}`} className="min-w-0 truncate text-bone hover:text-accent-soft">
                    {detail.email}
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 text-accent" />
                  <span className="text-bone">
                    {detail.city}
                    <br />
                    <span className="text-muted">{detail.district}</span>
                  </span>
                </li>
              </ul>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-[12px] border border-white/8 bg-white/[0.02] p-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">Bookings</p>
                <p className="display mt-1 text-[26px] text-bone">{detail.bookings?.length ?? 0}</p>
              </div>
              <div className="rounded-[12px] border border-white/8 bg-white/[0.02] p-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted">Confirmed value</p>
                <p className="display mt-1 text-[26px] text-bone">{formatINR(detail.lifetimeValue ?? 0)}</p>
              </div>
            </section>

            <section>
              <h3 className="eyebrow">Booking history</h3>
              {!detail.bookings?.length ? (
                <p className="mt-2 text-[12.5px] text-muted">No bookings recorded.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {detail.bookings.map((b) => (
                    <li key={b.bookingNumber} className="rounded-[10px] border border-white/8 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[11px] text-accent">{b.bookingNumber}</span>
                        <StatusIndicator status={b.status} size="sm" />
                      </div>
                      <p className="mt-1.5 text-[12.5px] text-bone">{b.serviceName}</p>
                      <p className="text-[11.5px] text-muted">
                        {formatDateRange(b.dates)} · {formatINR(b.estimate)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {detail.notes && (
              <section>
                <h3 className="eyebrow">Studio notes</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{detail.notes}</p>
              </section>
            )}

            <Badge tone="neutral">Client record · CRM</Badge>
          </div>
        ) : (
          <p className="text-[13px] text-muted">Loading client…</p>
        )}
      </Drawer>
    </div>
  );
}
