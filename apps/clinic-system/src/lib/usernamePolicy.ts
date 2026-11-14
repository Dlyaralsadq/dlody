import crypto from "crypto";

/** Internal username until the person confirms email and picks their own. */
export function makePendingUsername(): string {
  return `pending_${crypto.randomBytes(8).toString("hex")}`;
}

/** Phone-as-username accounts and unfinished signups still need a real name. */
export function needsChosenUsername(username: string): boolean {
  return username.startsWith("pending_") || /^\d{7,}$/.test(username);
}

/** Letters, digits, dot, and underscore. Must start with a letter. */
export function isValidChosenUsername(username: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9._]{2,23}$/.test(username);
}
