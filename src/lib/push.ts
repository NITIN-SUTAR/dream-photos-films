"use client";

import { api } from "./api";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
}

/** Subscribes this device to booking updates, proving booking access with the token. */
export async function subscribeToBookingUpdates(bookingNumber: string, token: string) {
  if (!pushSupported()) throw new Error("Push notifications are not available on this device.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");

  const registration = await navigator.serviceWorker.register("/sw.js");
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
      ),
    }));

  const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await api.post("/api/public/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
    bookingNumber,
    token,
  });
}
