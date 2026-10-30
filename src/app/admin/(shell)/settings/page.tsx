"use client";

import { useState } from "react";
import { Building2, CalendarCog, Globe, ImageIcon, Save, Share2 } from "lucide-react";
import { api, ApiFailure, useApi } from "@/lib/api";
import { PageIntro } from "@/components/admin/parts";
import { Button, ErrorState, Input, LoadingSkeleton, Select, Textarea, Toggle } from "@/components/ui/primitives";
import { Tabs, useToast } from "@/components/ui/overlays";

type Section = "studio" | "contact" | "social" | "booking" | "website" | "media";
type Settings = Record<string, unknown>;

export default function AdminSettingsPage() {
  const { data, loading, error, refetch } = useApi<{ settings: Settings; role: string }>("/api/admin/settings");
  const [tab, setTab] = useState<Section>("studio");
  const [draft, setDraft] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const { push } = useToast();
  const values = { ...(data?.settings ?? {}), ...draft };

  const text = (k: string, fallback = "") => (typeof values[k] === "string" ? (values[k] as string) : fallback);
  const number = (k: string, fallback = 0) => (typeof values[k] === "number" ? (values[k] as number) : fallback);
  const flag = (k: string) => values[k] === true;
  const set = (k: string, v: unknown) => setDraft((cur) => ({ ...cur, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const saved = await api.patch<{ settings: Settings }>("/api/admin/settings", values);
      setDraft(saved.settings);
      push({ tone: "success", title: "Settings saved", description: "The public site now reflects these values." });
    } catch (err) {
      push({ tone: "error", title: "Could not save settings", description: (err as ApiFailure).message });
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorState title="Settings unavailable" description={error.message} onRetry={refetch} />;
  if (loading) return <LoadingSkeleton className="h-96 w-full" />;

  return (
    <div>
      <PageIntro
        title="Studio settings"
        description="Business information, booking rules and website preferences. Secrets are never stored here — they live in server environment variables."
        actions={
          <Button size="sm" variant="accent" icon={Save} loading={saving} onClick={save}>
            Save changes
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "studio", label: "Studio" },
          { value: "contact", label: "Contact" },
          { value: "social", label: "Social" },
          { value: "booking", label: "Booking" },
          { value: "website", label: "Website" },
          { value: "media", label: "Media" },
        ]}
        className="mb-5"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <section className="rounded-[14px] panel p-5 sm:p-6">
          {tab === "studio" && (
            <Panel icon={Building2} title="Studio information">
              <Input label="Studio name" value={text("studio_name")} onChange={(e) => set("studio_name", e.target.value)} />
              <Textarea label="Tagline" value={text("tagline")} onChange={(e) => set("tagline", e.target.value)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Address" value={text("address")} onChange={(e) => set("address", e.target.value)} />
                <Input label="City / postcode" value={text("city")} onChange={(e) => set("city", e.target.value)} />
              </div>
              <Select
                label="Business timezone"
                value={text("timezone_iana", "Asia/Kolkata")}
                options={[
                  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
                  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+4)" },
                  { value: "Europe/London", label: "Europe/London (GMT)" },
                ]}
                onChange={(e) => set("timezone_iana", e.target.value)}
              />
            </Panel>
          )}

          {tab === "contact" && (
            <Panel icon={Building2} title="Contact information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Phone" value={text("phone")} onChange={(e) => set("phone", e.target.value)} />
                <Input label="WhatsApp" value={text("whatsapp")} onChange={(e) => set("whatsapp", e.target.value)} />
              </div>
              <Input label="Studio email" type="email" value={text("studio_email")} onChange={(e) => set("studio_email", e.target.value)} />
            </Panel>
          )}

          {tab === "social" && (
            <Panel icon={Share2} title="Social links">
              <Input label="Instagram" value={text("instagram")} onChange={(e) => set("instagram", e.target.value)} />
              <Input label="YouTube" value={text("youtube")} onChange={(e) => set("youtube", e.target.value)} />
              <Input label="Facebook" value={text("facebook")} onChange={(e) => set("facebook", e.target.value)} />
            </Panel>
          )}

          {tab === "booking" && (
            <Panel icon={CalendarCog} title="Booking preferences">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Pending hold (hours)"
                  type="number"
                  min={1}
                  value={number("pending_hold_hours", 24)}
                  onChange={(e) => set("pending_hold_hours", Number(e.target.value))}
                />
                <Input
                  label="Lead time (days)"
                  type="number"
                  min={0}
                  value={number("lead_time_days", 3)}
                  onChange={(e) => set("lead_time_days", Number(e.target.value))}
                />
                <Input
                  label="Max booking days"
                  type="number"
                  min={1}
                  value={number("max_booking_days", 5)}
                  onChange={(e) => set("max_booking_days", Number(e.target.value))}
                />
              </div>
              <div className="divide-y divide-white/8">
                <Toggle
                  label="Allow multi-day bookings"
                  description="Clients can request a date range or several individual days."
                  checked={flag("allow_multi_day")}
                  onChange={(v) => set("allow_multi_day", v)}
                />
                <Toggle
                  label="Show prices publicly"
                  description="Hide to require an enquiry before any pricing is shown."
                  checked={flag("show_prices_publicly")}
                  onChange={(v) => set("show_prices_publicly", v)}
                />
              </div>
            </Panel>
          )}

          {tab === "website" && (
            <Panel icon={Globe} title="Website preferences">
              <div className="divide-y divide-white/8">
                <Toggle
                  label="Maintenance mode"
                  description="Replaces the public site with a holding page."
                  checked={flag("maintenance_mode")}
                  onChange={(v) => set("maintenance_mode", v)}
                />
                <Toggle
                  label="Watermark public images"
                  description="Applies a subtle studio mark to portfolio frames."
                  checked={flag("watermark")}
                  onChange={(v) => set("watermark", v)}
                />
              </div>
            </Panel>
          )}

          {tab === "media" && (
            <Panel icon={ImageIcon} title="Media preferences">
              <Input
                label="Maximum upload size (MB)"
                type="number"
                min={1}
                value={number("max_upload_mb", 25)}
                onChange={(e) => set("max_upload_mb", Number(e.target.value))}
              />
              <Select
                label="Delivery image quality"
                value={text("image_quality", "High")}
                options={[
                  { value: "Balanced", label: "Balanced — fastest galleries" },
                  { value: "High", label: "High — recommended" },
                  { value: "Maximum", label: "Maximum — largest files" },
                ]}
                onChange={(e) => set("image_quality", e.target.value)}
              />
            </Panel>
          )}
        </section>

        <aside className="rounded-[14px] panel p-5" aria-label="Preview">
          <p className="eyebrow">Live preview</p>
          <p className="display mt-2 text-[22px] text-bone">{text("studio_name")}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{text("tagline")}</p>
          <dl className="mt-5 space-y-2.5 border-t border-white/8 pt-4 text-[12.5px]">
            <Row label="Phone" value={text("phone")} />
            <Row label="Email" value={text("studio_email")} />
            <Row label="Studio" value={`${text("address")}, ${text("city")}`} />
            <Row label="Timezone" value={text("timezone_iana", "Asia/Kolkata")} />
            <Row label="Hold window" value={`${number("pending_hold_hours", 24)} hours`} />
          </dl>
          <p className="mt-5 text-[11.5px] leading-relaxed text-muted/70">
            API keys, VAPID keys and email credentials are stored as server environment variables
            and are never editable here.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-[14px] text-bone">
        <Icon aria-hidden className="h-4 w-4 text-accent" />
        {title}
      </h3>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="break-words text-right text-bone">{value}</dd>
    </div>
  );
}
