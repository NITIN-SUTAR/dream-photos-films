import { eq, sql } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import {
  bookings,
  bookingExtras,
  clients,
  notificationEvents,
  packages,
  packageOptions,
  services,
  mediaAssets,
} from "@/db/schema";
import { escapeHtml } from "./http";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MEDIA_ROOT = process.env.MEDIA_ROOT ?? path.join(process.cwd(), ".data", "media");
const MAX_ATTEMPTS = 5;

export interface BookingEmailData {
  bookingNumber: string;
  status: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  district: string;
  city: string;
  serviceName: string;
  packageName: string | null;
  albumOption: string | null;
  dates: string[];
  extras: { name: string; price: number }[];
  baseAmount: number;
  extrasAmount: number;
  total: number;
  currency: string;
  notes: string;
  budget: string;
  submittedAt: string;
  expiresAt: string | null;
}

export async function loadBookingEmailData(bookingId: string): Promise<BookingEmailData | null> {
  const rows = await db
    .select({
      b: bookings,
      c: clients,
      s: services,
      p: packages,
      o: packageOptions,
    })
    .from(bookings)
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(packages, eq(packages.id, bookings.packageId))
    .leftJoin(packageOptions, eq(packageOptions.id, bookings.packageOptionId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const extras = await db
    .select({ name: bookingExtras.nameSnapshot, price: bookingExtras.priceSnapshot })
    .from(bookingExtras)
    .where(eq(bookingExtras.bookingId, bookingId));

  const dateRows = await db.execute<{ event_date: string }>(sql`
    select to_char(event_date, 'YYYY-MM-DD') as event_date
      from booking_dates where booking_id = ${bookingId} order by event_date
  `);

  return {
    bookingNumber: row.b.bookingNumber,
    status: row.b.status,
    clientName: row.c.name,
    clientEmail: row.c.email,
    clientPhone: row.c.phone,
    district: row.c.district,
    city: row.c.city,
    serviceName: row.s.name,
    packageName: row.p ? `${row.p.code} — ${row.p.name}` : null,
    albumOption: row.o ? row.o.label : null,
    dates: dateRows.rows.map((d) => d.event_date),
    extras: extras.map((e) => ({ name: e.name, price: Number(e.price) })),
    baseAmount: Number(row.b.basePrice),
    extrasAmount: Number(row.b.extrasTotal),
    total: Number(row.b.totalPrice),
    currency: row.b.currency,
    notes: row.b.visionNotes,
    budget: row.b.budget,
    submittedAt: row.b.submittedAt.toISOString(),
    expiresAt: row.b.expiresAt?.toISOString() ?? null,
  };
}

const money = (v: number, c = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(v);

/* ------------------------------ templates ------------------------------ */

const SUBJECTS: Record<string, (d: BookingEmailData, audience: string) => string> = {
  BOOKING_CREATED: (d, a) =>
    a === "STUDIO"
      ? `New booking request ${d.bookingNumber} — ${d.clientName}`
      : `We have your request — ${d.bookingNumber}`,
  BOOKING_CONFIRMED: (d) => `Your booking is confirmed — ${d.bookingNumber}`,
  BOOKING_REJECTED: (d) => `About your booking request ${d.bookingNumber}`,
  BOOKING_CANCELLED: (d) => `Your booking has been cancelled — ${d.bookingNumber}`,
  BOOKING_EXPIRED: (d) => `Your booking request has expired — ${d.bookingNumber}`,
};

const INTROS: Record<string, (d: BookingEmailData, a: string) => string> = {
  BOOKING_CREATED: (d, a) =>
    a === "STUDIO"
      ? `A new booking request has arrived and is holding the requested dates until ${d.expiresAt ? new Date(d.expiresAt).toUTCString() : "the hold expires"}.`
      : `Thank you — your request has been received and is awaiting confirmation from the studio. Nothing is confirmed yet; we will review availability and reply shortly.`,
  BOOKING_CONFIRMED: () =>
    `Your booking is confirmed. The dates below are now committed to you in our studio calendar.`,
  BOOKING_REJECTED: () =>
    `We are sorry — we could not accept this booking request. The dates have been released. Please reply to this email and we will try to find an alternative.`,
  BOOKING_CANCELLED: () => `This booking has been cancelled and the dates have been released.`,
  BOOKING_EXPIRED: () =>
    `Your booking request expired after the pending hold period and the dates have been released. You are welcome to submit a new request.`,
};

export function renderBookingEmail(
  eventType: string,
  d: BookingEmailData,
  audience: string,
): { subject: string; html: string; text: string } {
  const subject = (SUBJECTS[eventType] ?? SUBJECTS.BOOKING_CREATED)(d, audience);
  const intro = (INTROS[eventType] ?? INTROS.BOOKING_CREATED)(d, audience);
  const rows = (pairs: [string, string][]) =>
    pairs
      .map(
        ([k, v]) =>
          `<tr><td style="padding:7px 0;color:#a7a4a0;font-size:12px;letter-spacing:.06em;text-transform:uppercase">${escapeHtml(
            k,
          )}</td><td style="padding:7px 0;color:#f5f2ec;font-size:14px;text-align:right">${escapeHtml(v)}</td></tr>`,
      )
      .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#07070a;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07070a;padding:32px 12px">
<tr><td align="center">
<table width="100%" style="max-width:600px;background:linear-gradient(180deg,#101017,#0b0b10);border:1px solid rgba(245,242,236,.10);border-radius:16px;padding:32px">
  <tr><td>
    <p style="margin:0;color:#c9a227;font-size:11px;letter-spacing:.3em;text-transform:uppercase">Dream Photo's &amp; Film's</p>
    <h1 style="margin:14px 0 0;color:#f5f2ec;font-size:26px;font-weight:400">${escapeHtml(subject)}</h1>
    <p style="margin:16px 0 0;color:#a7a4a0;font-size:14px;line-height:1.7">${escapeHtml(intro)}</p>
    <div style="height:1px;background:rgba(245,242,236,.1);margin:24px 0"></div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${rows([
        ["Booking number", d.bookingNumber],
        ["Status", d.status],
        ["Client", d.clientName],
        ["Phone", d.clientPhone],
        ["Email", d.clientEmail],
        ["Location", [d.city, d.district].filter(Boolean).join(", ")],
        ["Service", d.serviceName],
        ["Package", d.packageName ?? "—"],
        ["Album", d.albumOption ?? "—"],
        ["Dates", d.dates.join(", ")],
        ["Duration", `${d.dates.length} day${d.dates.length > 1 ? "s" : ""}`],
      ])}
    </table>
    <div style="height:1px;background:rgba(245,242,236,.1);margin:24px 0"></div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${
        d.extras.length
          ? d.extras
              .map(
                (e) =>
                  `<tr><td style="padding:6px 0;color:#f5f2ec;font-size:13px">${escapeHtml(
                    e.name,
                  )}</td><td style="padding:6px 0;color:#a7a4a0;font-size:13px;text-align:right">${money(
                    e.price,
                    d.currency,
                  )}</td></tr>`,
              )
              .join("")
          : `<tr><td style="color:#a7a4a0;font-size:13px">No extras selected</td></tr>`
      }
      ${rows([
        ["Base amount", money(d.baseAmount, d.currency)],
        ["Extras total", money(d.extrasAmount, d.currency)],
      ])}
      <tr><td style="padding-top:14px;color:#c9a227;font-size:12px;letter-spacing:.2em;text-transform:uppercase">Estimated total</td>
      <td style="padding-top:14px;color:#f5f2ec;font-size:24px;text-align:right">${money(d.total, d.currency)}</td></tr>
    </table>
    ${
      d.notes
        ? `<div style="height:1px;background:rgba(245,242,236,.1);margin:24px 0"></div><p style="margin:0;color:#a7a4a0;font-size:12px;letter-spacing:.18em;text-transform:uppercase">Notes</p><p style="margin:8px 0 0;color:#f5f2ec;font-size:13px;line-height:1.7">${escapeHtml(d.notes)}</p>`
        : ""
    }
    <p style="margin:26px 0 0;color:#6f6d6a;font-size:11px;line-height:1.7">
      This is an estimate for planning, not an invoice or a payment request.<br/>
      Submitted ${escapeHtml(new Date(d.submittedAt).toUTCString())}${
        d.expiresAt ? ` · Hold expires ${escapeHtml(new Date(d.expiresAt).toUTCString())}` : ""
      }
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`;

  const text = `${subject}\n\n${intro}\n\nBooking ${d.bookingNumber}\nService: ${d.serviceName}\nPackage: ${
    d.packageName ?? "—"
  }\nDates: ${d.dates.join(", ")}\nEstimate: ${money(d.total, d.currency)}\n`;

  return { subject, html, text };
}

/* ---------------------------- PDF estimate ----------------------------- */

function pdfEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Minimal, dependency-free but genuinely valid PDF 1.4 document. */
export function buildEstimatePdf(d: BookingEmailData): Buffer {
  const lines: [string, number][] = [
    ["DREAM PHOTO'S & FILM'S", 20],
    ["Booking Estimate", 14],
    ["", 10],
    [`Booking number: ${d.bookingNumber}`, 11],
    [`Status: ${d.status}`, 11],
    [`Client: ${d.clientName}  ·  ${d.clientPhone}  ·  ${d.clientEmail}`, 11],
    [`Location: ${[d.city, d.district].filter(Boolean).join(", ")}`, 11],
    ["", 10],
    [`Service: ${d.serviceName}`, 11],
    [`Package: ${d.packageName ?? "-"}`, 11],
    [`Album: ${d.albumOption ?? "-"}`, 11],
    [`Dates: ${d.dates.join(", ")} (${d.dates.length} day${d.dates.length > 1 ? "s" : ""})`, 11],
    ["", 10],
    ["Extras:", 11],
    ...(d.extras.length
      ? d.extras.map((e) => [`   ${e.name} — ${money(e.price, d.currency)}`, 11] as [string, number])
      : ([["   None", 11]] as [string, number][])),
    ["", 10],
    [`Base amount: ${money(d.baseAmount, d.currency)}`, 11],
    [`Extras total: ${money(d.extrasAmount, d.currency)}`, 11],
    [`ESTIMATED TOTAL: ${money(d.total, d.currency)}`, 14],
    ["", 10],
    [`Submitted: ${new Date(d.submittedAt).toUTCString()}`, 9],
    [`Hold expires: ${d.expiresAt ? new Date(d.expiresAt).toUTCString() : "-"}`, 9],
    ["", 9],
    ["This document is an estimate for planning purposes only.", 9],
    ["Dream Photo's & Film's · Thane, Maharashtra · studio@dreamphotosfilms.in", 9],
  ];

  let y = 790;
  let content = "BT\n";
  for (const [text, size] of lines) {
    y -= size + 8;
    content += `/F1 ${size} Tf\n1 0 0 1 56 ${y} Tm\n(${pdfEscape(text)}) Tj\n`;
  }
  content += "ET\n";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${o.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

/** Stores the estimate PDF in the private-documents bucket and records the asset. */
export async function storeEstimatePdf(bookingId: string, d: BookingEmailData) {
  const pdf = buildEstimatePdf(d);
  const id = randomUUID();
  const storagePath = `documents/${bookingId}/${d.bookingNumber}-estimate.pdf`;
  const absolute = path.join(MEDIA_ROOT, "private-documents", storagePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, pdf);
  await db
    .insert(mediaAssets)
    .values({
      id,
      bucket: "private-documents",
      storagePath,
      mediaType: "DOCUMENT",
      mimeType: "application/pdf",
      fileSize: pdf.byteLength,
      status: "READY",
      originalName: `${d.bookingNumber}-estimate.pdf`,
    })
    .onConflictDoNothing();
  return { storagePath, size: pdf.byteLength };
}

/* ------------------------------ delivery ------------------------------- */

async function sendEmail(to: string, subject: string, html: string, text: string, attachment?: { name: string; content: string }) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY is not configured on the server");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME ?? "Dream Photo's & Film's",
        email: process.env.BREVO_SENDER_EMAIL ?? "studio@dreamphotosfilms.in",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      ...(attachment ? { attachment: [{ name: attachment.name, content: attachment.content }] } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo responded ${res.status}: ${body.slice(0, 180)}`);
  }
}

async function sendPush(endpoint: string, payload: Record<string, unknown>) {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID keys are not configured on the server");
  const [sub] = await db.execute<{ endpoint: string; p256dh: string; auth: string }>(sql`
    select endpoint, p256dh, auth from push_subscriptions where endpoint = ${endpoint} and active
  `).then((r) => r.rows);
  if (!sub) throw new Error("Subscription no longer active");
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:studio@dreamphotosfilms.in",
    pub,
    priv,
  );
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload),
  );
}

export interface ProcessResult {
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * Outbox worker. Claims pending events with SKIP LOCKED so repeated runs
 * (cron overlap, manual retries) can never deliver the same event twice.
 */
export async function processNotifications(limit = 20): Promise<ProcessResult> {
  const claimed = await db.execute<{
    id: string;
    booking_id: string | null;
    event_type: string;
    channel: string;
    recipient: string;
    payload: Record<string, unknown>;
    attempts: number;
  }>(sql`
    with claim as (
      select id from notification_events
       where status = 'PENDING'
       order by created_at
       limit ${limit}
       for update skip locked
    )
    update notification_events n
       set status = 'SENDING', attempts = n.attempts + 1, last_attempt_at = now()
      from claim
     where n.id = claim.id
     returning n.id, n.booking_id, n.event_type, n.channel, n.recipient, n.payload, n.attempts
  `);

  const result: ProcessResult = { claimed: claimed.rows.length, sent: 0, failed: 0, skipped: 0 };

  for (const ev of claimed.rows) {
    try {
      if (!ev.booking_id) throw new Error("Event has no booking reference");
      const data = await loadBookingEmailData(ev.booking_id);
      if (!data) throw new Error("Booking no longer exists");

      if (ev.channel === "EMAIL") {
        const audience = (ev.payload?.audience as string) ?? "CLIENT";
        const { subject, html, text } = renderBookingEmail(ev.event_type, data, audience);
        let attachment: { name: string; content: string } | undefined;
        if (audience === "STUDIO" && ev.event_type === "BOOKING_CREATED") {
          const pdf = buildEstimatePdf(data);
          await storeEstimatePdf(ev.booking_id, data);
          attachment = {
            name: `${data.bookingNumber}-estimate.pdf`,
            content: pdf.toString("base64"),
          };
        }
        await sendEmail(ev.recipient, subject, html, text, attachment);
      } else {
        await sendPush(ev.recipient, {
          title: `Booking ${data.bookingNumber}`,
          body: renderBookingEmail(ev.event_type, data, "CLIENT").subject,
          url: `/booking/${data.bookingNumber}`,
        });
      }

      await db
        .update(notificationEvents)
        .set({ status: "SENT", sentAt: new Date(), errorMessage: null })
        .where(eq(notificationEvents.id, ev.id));
      result.sent += 1;
    } catch (err) {
      const message = (err as Error).message.slice(0, 300);
      const permanent = ev.attempts >= MAX_ATTEMPTS;
      await db
        .update(notificationEvents)
        .set({ status: permanent ? "FAILED" : "PENDING", errorMessage: message })
        .where(eq(notificationEvents.id, ev.id));
      if (permanent) result.failed += 1;
      else result.skipped += 1;
      console.warn(
        `[notify] ${ev.event_type}/${ev.channel} attempt ${ev.attempts} failed: ${message}`,
      );
    }
  }
  return result;
}
