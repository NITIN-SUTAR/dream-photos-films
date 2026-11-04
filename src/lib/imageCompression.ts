export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  outputMimeType?: string;
  onProgress?: (value: number, message: string) => void;
}

export interface CompressionResult {
  file: File;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  wasCompressed: boolean;
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatPercentSaved(originalSize: number, compressedSize: number): string {
  if (!originalSize || !compressedSize) return "0%";
  const saved = ((originalSize - compressedSize) / originalSize) * 100;
  return `${Math.max(0, Math.min(100, saved)).toFixed(1)}%`;
}

function resolveCanvas() {
  if (typeof OffscreenCanvas !== "undefined") return OffscreenCanvas;
  if (typeof window !== "undefined" && "HTMLCanvasElement" in window) {
    return HTMLCanvasElement;
  }
  return null;
}

async function readExifOrientation(file: Blob): Promise<number> {
  if (!(file.type === "image/jpeg" || file.type === "image/tiff")) return 1;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xda) return 1;
    if (marker === 0xd9 || marker === 0x01) break;
    if ((marker >= 0xd0 && marker <= 0xd8) || marker === 0x01) {
      offset += 2;
      continue;
    }
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segmentLength < 2) return 1;
    if (marker === 0xe1) {
      const exifStart = offset + 4;
      if (
        bytes[exifStart] === 0x45 &&
        bytes[exifStart + 1] === 0x78 &&
        bytes[exifStart + 2] === 0x69 &&
        bytes[exifStart + 3] === 0x66
      ) {
        const tiffOffset = exifStart + 6;
        if (bytes[tiffOffset] === 0x49 && bytes[tiffOffset + 1] === 0x49) {
          const orientation = bytes[tiffOffset + 8];
          return Number.isInteger(orientation) ? orientation : 1;
        }
      }
    }
    offset += 2 + segmentLength;
  }
  return 1;
}

function applyExifOrientation(
  ctx: any,
  width: number,
  height: number,
  orientation: number,
): void {
  if (orientation === 2) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  } else if (orientation === 3) {
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
  } else if (orientation === 4) {
    ctx.translate(0, height);
    ctx.scale(1, -1);
  } else if (orientation === 5) {
    ctx.rotate(0.5 * Math.PI);
    ctx.scale(1, -1);
  } else if (orientation === 6) {
    ctx.rotate(0.5 * Math.PI);
    ctx.translate(0, -height);
  } else if (orientation === 7) {
    ctx.rotate(0.5 * Math.PI);
    ctx.translate(width, -height);
    ctx.scale(-1, 1);
  } else if (orientation === 8) {
    ctx.rotate(-0.5 * Math.PI);
    ctx.translate(-width, 0);
  }
}

function isAnimatedWebp(buffer: Uint8Array): boolean {
  if (buffer.length < 12) return false;
  const riff = Array.from(buffer.slice(0, 4)).map((b) => String.fromCharCode(b)).join("");
  if (riff !== "RIFF") return false;
  const webp = Array.from(buffer.slice(8, 12)).map((b) => String.fromCharCode(b)).join("");
  if (webp !== "WEBP") return false;
  const marker = new Uint8Array([0x56, 0x50, 0x38, 0x58]);
  const vp8x = buffer.findIndex((_, index) => {
    if (index + 4 > buffer.length) return false;
    return buffer[index] === marker[0] && buffer[index + 1] === marker[1] && buffer[index + 2] === marker[2] && buffer[index + 3] === marker[3];
  });
  if (vp8x < 0) return false;
  const animationBit = buffer[vp8x + 9] & 0x02;
  return animationBit !== 0;
}

export async function readVideoMetadata(file: File): Promise<{ duration: number | null; width: number | null; height: number | null }> {
  if (typeof document === "undefined") return { duration: null, width: null, height: null };
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    await new Promise<void>((resolve) => {
      const cleanup = () => {
        video.onloadedmetadata = null;
        video.onerror = null;
        resolve();
      };
      video.onloadedmetadata = cleanup;
      video.onerror = cleanup;
    });

    return {
      duration: Number.isFinite(video.duration) ? Number(video.duration) : null,
      width: Number.isFinite(video.videoWidth) ? Number(video.videoWidth) : null,
      height: Number.isFinite(video.videoHeight) ? Number(video.videoHeight) : null,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function validateCompressedVideoOutput(blob: Blob): void {
  if (!(blob instanceof Blob)) throw new Error("Video compression produced an invalid output object.");
  if (blob.size <= 0) throw new Error("Video compression produced an empty output file.");
  if (!blob.type.includes("mp4")) throw new Error("The compressed video output is not valid MP4 data.");
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const { maxDimension = 2200, quality = 0.8, outputMimeType, onProgress } = options;
  if (typeof window === "undefined") throw new Error("Image compression requires a browser environment.");
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be compressed with the image encoder.");
  }
  const originalSize = file.size;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const isAnimatedImage = file.type === "image/webp" && isAnimatedWebp(buffer);
  if (isAnimatedImage) {
    const clone = new File([file], file.name, { type: file.type, lastModified: file.lastModified });
    return {
      file: clone,
      mimeType: file.type,
      width: null,
      height: null,
      durationSeconds: null,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      wasCompressed: false,
    };
  }

  const targetType =
    outputMimeType ??
    (file.type === "image/png" || file.type === "image/webp" ? "image/webp" : "image/jpeg");

  onProgress?.(0.2, "Reading source image");
  const bitmap = typeof createImageBitmap === "function" ? await createImageBitmap(file) : null;
  if (!bitmap) throw new Error("This browser does not support built-in image decoding.");

  let width = bitmap.width;
  let height = bitmap.height;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));

  const CanvasClass = resolveCanvas();
  if (!CanvasClass) throw new Error("Canvas is not supported in this browser.");

  const canvas: any =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(nextWidth, nextHeight)
      : document.createElement("canvas");
  canvas.width = nextWidth;
  canvas.height = nextHeight;
  const ctx = canvas.getContext("2d") as any;
  if (!ctx) throw new Error("Canvas is not available.");

  const orientation = await readExifOrientation(file);
  if (orientation > 1 && orientation <= 8) {
    ctx.save();
    applyExifOrientation(ctx, nextWidth, nextHeight, orientation);
    ctx.drawImage(bitmap, 0, 0, nextWidth, nextHeight);
    ctx.restore();
  } else {
    ctx.drawImage(bitmap, 0, 0, nextWidth, nextHeight);
  }

  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    try {
      if (typeof canvas.convertToBlob === "function") {
        canvas
          .convertToBlob({ type: targetType, quality })
          .then(resolve)
          .catch(reject);
        return;
      }
      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob) return reject(new Error("The browser could not encode the compressed image."));
          resolve(blob);
        },
        targetType,
        quality,
      );
    } catch (error) {
      reject(error);
    }
  });

  const suffix = outputBlob.type.includes("png") ? ".png" : outputBlob.type.includes("jpeg") ? ".jpg" : ".webp";
  const compressedFile = new File([outputBlob], file.name.replace(/\.[^.]+$/, "") + suffix, {
    type: outputBlob.type,
    lastModified: Date.now(),
  });

  const result = {
    file: compressedFile,
    mimeType: outputBlob.type,
    width: nextWidth,
    height: nextHeight,
    durationSeconds: null,
    originalSize,
    compressedSize: outputBlob.size,
    reductionPercent: originalSize > 0 ? ((originalSize - outputBlob.size) / originalSize) * 100 : 0,
    wasCompressed: outputBlob.size < originalSize || outputBlob.type !== file.type,
  };

  onProgress?.(1, `Compressed to ${formatBytes(outputBlob.size)}`);
  return result;
}

export function shouldSkipVideoCompression(file: File, maxBytes = 25 * 1024 * 1024): boolean {
  return file.type === "video/mp4" && file.size > 0 && file.size <= maxBytes;
}

export async function compressVideoFile(
  file: File,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const { onProgress } = options;
  if (typeof window === "undefined") throw new Error("Video compression requires a browser environment.");
  if (!file.type.startsWith("video/")) {
    throw new Error("Only video files can be compressed with the FFmpeg pipeline.");
  }

  if (shouldSkipVideoCompression(file)) {
    const metadata = await readVideoMetadata(file);
    const result: CompressionResult = {
      file,
      mimeType: file.type,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      durationSeconds: metadata.duration ?? null,
      originalSize: file.size,
      compressedSize: file.size,
      reductionPercent: 0,
      wasCompressed: false,
    };
    onProgress?.(1, `Using original ${formatBytes(file.size)} MP4`);
    return result;
  }

  const originalMeta = await readVideoMetadata(file);
  onProgress?.(0.12, "Loading video codec");

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  const coreBase = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

  ffmpeg.on("progress", ({ progress }) => {
    if (typeof progress === "number") onProgress?.(0.15 + progress * 0.75, "Encoding video");
  });

  await ffmpeg.load({
    coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, "application/wasm"),
  });

  const inputName = `input${file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".mp4"}`;
  const outputName = "output.mp4";
  const data = await fetchFile(file);
  await ffmpeg.writeFile(inputName, data);

  const args = [
    "-i",
    inputName,
    "-vf",
    "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black@0.0",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-shortest",
    outputName,
  ];

  try {
    await ffmpeg.exec(args);
    const outputData = await ffmpeg.readFile(outputName);
    if (!(outputData instanceof Uint8Array) || outputData.length === 0) {
      throw new Error("Video compression produced an empty output file.");
    }

    const blob = new Blob([outputData as BlobPart], { type: "video/mp4" });
    validateCompressedVideoOutput(blob);

    const metadata = await readVideoMetadata(new File([blob], file.name.replace(/\.[^.]+$/, "") + ".mp4", { type: "video/mp4" }));
    const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".mp4", {
      type: "video/mp4",
      lastModified: Date.now(),
    });

    const originalSize = file.size;
    const result: CompressionResult = {
      file: compressedFile,
      mimeType: "video/mp4",
      width: metadata.width ?? originalMeta.width ?? null,
      height: metadata.height ?? originalMeta.height ?? null,
      durationSeconds: metadata.duration ?? originalMeta.duration ?? null,
      originalSize,
      compressedSize: blob.size,
      reductionPercent: originalSize > 0 ? ((originalSize - blob.size) / originalSize) * 100 : 0,
      wasCompressed: blob.size < originalSize,
    };

    onProgress?.(1, `Compressed to ${formatBytes(blob.size)}`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "The video compression pipeline failed.";
    throw new Error(`Video compression failed: ${message}`);
  }
}

export function makeStoragePath(scope: string, fileName: string, kind: "IMAGE" | "VIDEO") {
  const clean = fileName
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  const extension = kind === "VIDEO" ? ".mp4" : ".webp";
  const base = clean ? clean.replace(/\.[^.]+$/, "") : "media";
  return `${scope}/${Date.now()}-${base}${extension}`;
}
