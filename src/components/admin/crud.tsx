"use client";

import { useCallback, useState } from "react";
import { api, ApiFailure, useApi } from "@/lib/api";
import { useToast } from "@/components/ui/overlays";

/**
 * Shared admin CRUD wiring: real API reads, real mutations, refetch on success
 * and human-readable error toasts. Every admin screen uses this so no button
 * is left with fake local-only state.
 */
export function useCrud<T>(path: string, pick: (payload: never) => T) {
  const { data, loading, error, refetch } = useApi<never>(path);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const run = useCallback(
    async (fn: () => Promise<unknown>, success: string) => {
      setBusy(true);
      try {
        await fn();
        await refetch();
        push({ tone: "success", title: success });
        return true;
      } catch (err) {
        const e = err as ApiFailure;
        push({ tone: "error", title: "That did not save", description: e.message });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refetch, push],
  );

  return {
    payload: data,
    items: data ? pick(data) : null,
    loading,
    error,
    refetch,
    busy,
    create: (body: unknown, msg = "Created") => run(() => api.post(path, body), msg),
    update: (id: string, body: unknown, msg = "Saved") =>
      run(() => api.patch(`${path.split("?")[0]}/${id}`, body), msg),
    remove: (id: string, msg = "Deleted") =>
      run(() => api.del(`${path.split("?")[0]}/${id}`), msg),
    run,
  };
}

export function reorderValue<T extends { displayOrder: number }>(
  items: T[],
  index: number,
  dir: -1 | 1,
): { a: T; b: T } | null {
  const target = items[index + dir];
  const current = items[index];
  if (!target || !current) return null;
  return { a: current, b: target };
}
