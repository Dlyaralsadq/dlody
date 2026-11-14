const DOH = "https://cloudflare-dns.com/dns-query";

const EMAIL_RE =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.test",
  "clinic.com",
  "email.com",
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "yopmail.com",
  "yopmail.fr",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "throwawaymail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mailnesia.com",
  "tempinbox.com",
  "moakt.com",
  "emailondeck.com",
  "spam4.me",
  "discard.email",
  "trash-mail.com",
  "guerrillamail.de",
  "mailnull.com",
  "tempmailo.com",
  "mintemail.com",
  "mytemp.email",
  "tempail.com",
  "dropmail.me",
  "inboxkitten.com",
]);

export type RealEmailError = "invalid_email" | "unreal_email" | "email_check_failed";

export type AccountEmail =
  | { status: "empty" }
  | { status: "ok"; email: string }
  | { status: "error"; error: RealEmailError };

async function doh(domain: string, type: "MX" | "A"): Promise<"yes" | "no" | "unknown"> {
  try {
    const response = await fetch(`${DOH}?name=${encodeURIComponent(domain)}&type=${type}`, {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "unknown";
    const body = (await response.json()) as { Status?: number; Answer?: { type?: number; data?: string }[] };
    if (body.Status === 3) return "no";
    if (body.Status !== 0) return "unknown";
    const answers = body.Answer ?? [];
    if (type === "MX") {
      return answers.some((record) => record.type === 15 && record.data && !record.data.startsWith("0 .")) ? "yes" : "no";
    }
    return answers.some((record) => record.type === 1 && record.data) ? "yes" : "no";
  } catch {
    return "unknown";
  }
}

async function domainAcceptsMail(domain: string): Promise<"yes" | "no" | "unknown"> {
  const mx = await doh(domain, "MX");
  if (mx === "yes") return "yes";
  if (mx === "unknown") return "unknown";
  const address = await doh(domain, "A");
  if (address === "yes") return "yes";
  if (address === "unknown") return "unknown";
  return "no";
}

/** Accept only an address whose domain can receive mail. Empty input is not an email. */
export async function checkRealEmail(raw: string): Promise<AccountEmail> {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254 || email.includes("..") || !EMAIL_RE.test(email)) {
    return { status: "error", error: "invalid_email" };
  }

  const domain = email.split("@")[1] ?? "";
  const blocked =
    BLOCKED_DOMAINS.has(domain) ||
    domain.endsWith(".test") ||
    domain.endsWith(".invalid") ||
    domain.endsWith(".example") ||
    domain.endsWith(".localhost");
  if (!domain || blocked) return { status: "error", error: "unreal_email" };

  const accepts = await domainAcceptsMail(domain);
  if (accepts === "unknown") return { status: "error", error: "email_check_failed" };
  if (accepts === "no") return { status: "error", error: "unreal_email" };
  return { status: "ok", email };
}

export async function normalizeAccountEmail(raw: string | null | undefined): Promise<AccountEmail> {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { status: "empty" };
  return checkRealEmail(trimmed);
}
