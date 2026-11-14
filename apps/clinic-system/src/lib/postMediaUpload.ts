import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getPostsUploadDir, getStoriesUploadDir, getAvatarsUploadDir } from "@/lib/appPaths";
import { saveStoredObject } from "@/lib/storedObjects";

async function persistUpload(dir: string, filename: string, mimeType: string, buffer: Buffer, folder: "posts" | "stories" | "avatars") {
  await saveStoredObject(`uploads/${folder}/${filename}`, mimeType, buffer);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
  } catch {
    // The database copy is the one that survives a deploy.
  }
}

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 25 * 1024 * 1024;
const MAX_AVATAR = 3 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

function inferMimeType(file: File): string | null {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? EXT_MIME[ext] ?? null : null;
}

export async function savePostMediaFile(
  userId: string,
  file: File
): Promise<{ url: string; mediaType: "image" | "video" } | { error: string }> {
  if (!file || file.size === 0) return { error: "no_file" };

  const mime = inferMimeType(file);
  const isImage = mime ? IMAGE_TYPES.has(mime) : /\.(jpe?g|png|webp|gif)$/i.test(file.name);
  const isVideo = mime ? VIDEO_TYPES.has(mime) : /\.(mp4|webm|mov)$/i.test(file.name);

  if (!isImage && !isVideo) return { error: "invalid_type" };

  const maxSize = isImage ? MAX_IMAGE : MAX_VIDEO;
  if (file.size > maxSize) return { error: "file_too_large" };

  const ext = file.name.split(".").pop()?.toLowerCase() || (isImage ? "jpg" : "mp4");
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || (isImage ? "jpg" : "mp4");
  const filename = `${userId}-${Date.now()}.${safeExt}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await persistUpload(getPostsUploadDir(), filename, mime || (isImage ? "image/jpeg" : "video/mp4"), buffer, "posts");

  return {
    url: `/uploads/posts/${filename}`,
    mediaType: isImage ? "image" : "video",
  };
}

export async function saveStoryMediaFile(
  userId: string,
  file: File
): Promise<{ url: string; mediaType: "image" | "video" } | { error: string }> {
  if (!file || file.size === 0) return { error: "no_file" };

  const mime = inferMimeType(file);
  const isImage = mime ? IMAGE_TYPES.has(mime) : /\.(jpe?g|png|webp|gif)$/i.test(file.name);
  const isVideo = mime ? VIDEO_TYPES.has(mime) : /\.(mp4|webm|mov)$/i.test(file.name);

  if (!isImage && !isVideo) return { error: "invalid_type" };

  const maxSize = isImage ? MAX_IMAGE : MAX_VIDEO;
  if (file.size > maxSize) return { error: "file_too_large" };

  const ext = file.name.split(".").pop()?.toLowerCase() || (isImage ? "jpg" : "mp4");
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || (isImage ? "jpg" : "mp4");
  const filename = `${userId}-${Date.now()}.${safeExt}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await persistUpload(getStoriesUploadDir(), filename, mime || (isImage ? "image/jpeg" : "video/mp4"), buffer, "stories");

  return {
    url: `/uploads/stories/${filename}`,
    mediaType: isImage ? "image" : "video",
  };
}

export async function saveAvatarFile(
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  if (!file || file.size === 0) return { error: "no_file" };

  const mime = inferMimeType(file);
  const isImage = mime ? IMAGE_TYPES.has(mime) : /\.(jpe?g|png|webp|gif)$/i.test(file.name);
  if (!isImage) return { error: "invalid_type" };
  if (file.size > MAX_AVATAR) return { error: "file_too_large" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${userId}-${Date.now()}.${safeExt}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await persistUpload(getAvatarsUploadDir(), filename, mime || "image/jpeg", buffer, "avatars");

  return { url: `/uploads/avatars/${filename}` };
}
