import assert from "node:assert/strict";
import test from "node:test";

import { resolveFilmAssetIds } from "../app/api/admin/[...path]/route.ts";
import { signMediaPath, verifyMediaSignature } from "./mediaSigning.ts";
import {
  cleanupFailedStorageRegistration,
  deleteSupabaseStorageObjects,
  readMediaFromSupabase,
} from "./media.ts";
import { readVideoMetadata, shouldSkipVideoCompression, validateCompressedVideoOutput } from "../lib/imageCompression.ts";

test("deleteSupabaseStorageObjects removes unique valid paths", async () => {
  const calls: Array<{ bucket: string; paths: string[] }> = [];
  const fakeClient = {
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          calls.push({ bucket, paths });
          return { error: null };
        },
      }),
    },
  };

  await deleteSupabaseStorageObjects(fakeClient as any, "public-media", [
    "portfolio/2024/test.jpg",
    "portfolio/2024/test.jpg",
    null,
    "portfolio/2024/second.jpg",
  ]);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].bucket, "public-media");
  assert.deepEqual(calls[0].paths, ["portfolio/2024/test.jpg", "portfolio/2024/second.jpg"]);
});

test("deleteSupabaseStorageObjects rejects unsafe relative paths", async () => {
  const fakeClient = {
    storage: {
      from: () => ({
        remove: async () => ({ error: null }),
      }),
    },
  };

  await assert.rejects(
    () => deleteSupabaseStorageObjects(fakeClient as any, "public-media", ["../../secret.jpg"]),
    /ACCESS_DENIED/,
  );
});

test("cleanupFailedStorageRegistration delegates to storage cleanup", async () => {
  const calls: Array<{ bucket: string; paths: string[] }> = [];
  const fakeClient = {
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          calls.push({ bucket, paths });
          return { error: null };
        },
      }),
    },
  };

  await cleanupFailedStorageRegistration(fakeClient as any, "public-media", "portfolio/draft.jpg");
  assert.deepEqual(calls[0], { bucket: "public-media", paths: ["portfolio/draft.jpg"] });
});

test("readMediaFromSupabase downloads the public object body", async () => {
  const fakeClient = {
    storage: {
      from: (bucket: string) => ({
        download: async (path: string) => {
          assert.equal(bucket, "public-media");
          assert.equal(path, "portfolio/cover.jpg");
          return {
            data: new Blob([new Uint8Array([10, 20, 30])]),
            error: null,
          };
        },
      }),
    },
  };

  const result = await readMediaFromSupabase(fakeClient as any, "public-media", "portfolio/cover.jpg");
  assert.deepEqual(Array.from(result), [10, 20, 30]);
});

test("private media URL signatures are valid and time-bound", () => {
  const mediaPath = "private-gallery/portfolio/apollo.jpg";
  const signed = signMediaPath(mediaPath, 60);
  const exp = signed.match(/exp=(\d+)/)?.[1];
  const sig = signed.match(/sig=([A-Za-z0-9_-]+)/)?.[1];

  assert.ok(exp);
  assert.ok(sig);
  assert.equal(verifyMediaSignature(mediaPath, exp!, sig!), true);
  assert.equal(verifyMediaSignature(mediaPath, String(Number(exp!) - 1), sig!), false);
});

test("video metadata extraction reads browser metadata", async () => {
  const originalDocument = globalThis.document;
  const originalURL = globalThis.URL;
  const fakeVideo = {
    _src: "",
    duration: 12.5,
    videoWidth: 1280,
    videoHeight: 720,
    preload: "",
    muted: false,
    playsInline: false,
    onloadedmetadata: null as (() => void) | null,
    onerror: null as (() => void) | null,
    set src(value: string) {
      this._src = value;
      queueMicrotask(() => {
        this.onloadedmetadata?.();
      });
    },
    get src() {
      return this._src;
    },
  };

  Object.defineProperty(globalThis, "document", {
    value: {
      createElement: () => fakeVideo,
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, "URL", {
    value: {
      createObjectURL: () => "blob:mock-video",
      revokeObjectURL: () => {},
    },
    configurable: true,
  });

  try {
    const metadata = await readVideoMetadata(new File(["video"], "clip.mp4", { type: "video/mp4" }));
    assert.equal(metadata.duration, 12.5);
    assert.equal(metadata.width, 1280);
    assert.equal(metadata.height, 720);
  } finally {
    Object.defineProperty(globalThis, "document", { value: originalDocument, configurable: true });
    Object.defineProperty(globalThis, "URL", { value: originalURL, configurable: true });
  }
});

test("small already-valid MP4 uploads bypass expensive FFmpeg transcode", () => {
  const smallMp4 = new File([new Uint8Array([1, 2, 3, 4])], "small.mp4", { type: "video/mp4" });
  const largeMp4 = new File([new Uint8Array(new Array(26 * 1024 * 1024).fill(1))], "large.mp4", { type: "video/mp4" });
  const webm = new File([new Uint8Array([1, 2, 3, 4])], "small.webm", { type: "video/webm" });

  assert.equal(shouldSkipVideoCompression(smallMp4), true);
  assert.equal(shouldSkipVideoCompression(largeMp4), false);
  assert.equal(shouldSkipVideoCompression(webm), false);
});

test("resolveFilmAssetIds keeps only valid UUID asset references", () => {
  const validPoster = "2123172b-f1eb-4e39-9af3-5b058f06fa35";
  const validVideo = "585bde01-01ab-4c6b-b06b-441cfc215744";

  assert.deepEqual(resolveFilmAssetIds({ posterAssetId: validPoster, videoAssetId: validVideo }), {
    posterAssetId: validPoster,
    videoAssetId: validVideo,
  });
  assert.deepEqual(resolveFilmAssetIds({ posterAssetId: "not-a-uuid", videoAssetId: validVideo }), {
    posterAssetId: null,
    videoAssetId: validVideo,
  });
  assert.deepEqual(resolveFilmAssetIds({}), { posterAssetId: null, videoAssetId: null });
});

test("invalid FFmpeg output is rejected before success is reported", () => {
  assert.doesNotThrow(() => validateCompressedVideoOutput(new Blob([new Uint8Array([1, 2, 3])], { type: "video/mp4" })));
  assert.throws(
    () => validateCompressedVideoOutput(new Blob([], { type: "video/mp4" })),
    /empty output file/i,
  );
  assert.throws(
    () => validateCompressedVideoOutput(new Blob([new Uint8Array([9, 9, 9])], { type: "image/jpeg" })),
    /not valid mp4/i,
  );
});
