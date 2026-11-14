import { existsSync } from "fs";
import path from "path";

/** Resolve the Next.js app `public` directory (works from monorepo root or app package). */
export function getPublicDir(): string {
  const candidates = [
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "apps", "clinic-system", "public"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0];
}

export function getPostsUploadDir(): string {
  return path.join(getPublicDir(), "uploads", "posts");
}

export function getStoriesUploadDir(): string {
  return path.join(getPublicDir(), "uploads", "stories");
}

export function getAvatarsUploadDir(): string {
  return path.join(getPublicDir(), "uploads", "avatars");
}
