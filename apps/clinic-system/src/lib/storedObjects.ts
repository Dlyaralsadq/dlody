import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const KEY_RE =
  /^(patient-files\/[a-f0-9]{32}\.(jpg|png|webp|pdf)|uploads\/(posts|stories|avatars)\/[A-Za-z0-9._-]{1,180})$/;

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function isStoredObjectKey(key: string): boolean {
  return KEY_RE.test(key);
}

export async function saveStoredObject(key: string, mimeType: string, bytes: Buffer): Promise<void> {
  if (!isStoredObjectKey(key)) throw new Error("invalid_key");
  const payload = Uint8Array.from(bytes);
  await prisma.storedObject.upsert({
    where: { key },
    create: { key, mimeType, bytes: payload },
    update: { mimeType, bytes: payload },
  });
}

export async function readStoredObject(key: string): Promise<{ mimeType: string; bytes: Buffer } | null> {
  if (!isStoredObjectKey(key)) return null;
  const row = await prisma.storedObject.findUnique({ where: { key } });
  if (!row) return null;
  return { mimeType: row.mimeType, bytes: Buffer.from(row.bytes) };
}

/** Read from the database, and copy an older file off disk into the database when found. */
export async function readStoredObjectOrDisk(
  key: string,
  diskPath: string
): Promise<{ mimeType: string; bytes: Buffer } | null> {
  const stored = await readStoredObject(key);
  if (stored) return stored;

  try {
    const bytes = await readFile(diskPath);
    const ext = path.extname(diskPath).slice(1).toLowerCase();
    const mimeType = EXT_MIME[ext] ?? "application/octet-stream";
    await saveStoredObject(key, mimeType, bytes).catch(() => undefined);
    return { mimeType, bytes };
  } catch {
    return null;
  }
}
