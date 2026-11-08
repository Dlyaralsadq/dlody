import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function getPatientFilesDir(): string {
  const candidates = [
    path.join(process.cwd(), "data", "patient-files"),
    path.join(process.cwd(), "apps", "clinic-system", "data", "patient-files"),
  ];
  return candidates[0];
}

export async function savePatientFile(file: File): Promise<
  { storageKey: string; mimeType: string; sizeBytes: number; fileName: string } | { error: string }
> {
  if (!file || file.size === 0) return { error: "no_file" };
  if (file.size > MAX_BYTES) return { error: "file_too_large" };

  const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
  const ext = ALLOWED[mime];
  if (!ext) return { error: "invalid_type" };

  const storageKey = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  const dir = getPatientFilesDir();
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storageKey), buffer);

  const fileName = path.basename(file.name).slice(0, 180) || `file.${ext}`;
  return { storageKey, mimeType: mime, sizeBytes: file.size, fileName };
}

export async function readPatientFile(storageKey: string): Promise<Buffer | null> {
  if (!/^[a-f0-9]{32}\.(jpg|png|webp|pdf)$/.test(storageKey)) return null;
  try {
    return await readFile(path.join(getPatientFilesDir(), storageKey));
  } catch {
    return null;
  }
}
