/**
 * Pluggable outbound notification channels for security-sensitive messages
 * (currently: password-reset codes). Uses plain `fetch` against provider
 * HTTP APIs so no extra npm dependency is required.
 *
 * Configure via environment variables:
 *  - Email:    RESEND_API_KEY (+ optional RESET_EMAIL_FROM)
 *  - SMS:      TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *  - WhatsApp: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *              (e.g. "whatsapp:+14155238886" for the Twilio sandbox number,
 *              or your own WhatsApp-enabled Twilio number in production)
 *
 * For a phone identifier, WhatsApp is tried first (when configured) and SMS
 * is used as a fallback (or vice versa if only SMS is configured) — this
 * maximizes the chance of actual delivery without any code changes once an
 * admin fills in the env vars.
 *
 * If nothing is configured, the code is written to the server console only
 * (never sent back to the browser) so the app stays usable in local/dev
 * setups while remaining safe: a request never reveals the code to whoever
 * submitted it.
 */

/**
 * Local numbers in this app are stored as plain digits (e.g. "07701234567",
 * the way Iraqi mobile numbers are typed at booking/registration). Provider
 * APIs require E.164 (e.g. "+9647701234567") — sending the raw digits with
 * just a "+" prefix produces an invalid number and silently fails, which is
 * the most common reason a "configured" SMS/WhatsApp integration never
 * actually reaches the phone.
 */
function toE164Iraq(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("964")) return `+${d}`;
  if (d.startsWith("0")) d = d.slice(1);
  return `+964${d}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from = process.env.RESET_EMAIL_FROM || "Tabibee <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("[notify] Resend email failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify] Email send error", err);
    return false;
  }
}

async function twilioSend(to: string, from: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return false;

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) {
      console.error("[notify] Twilio send failed", to, res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify] Twilio send error", err);
    return false;
  }
}

async function sendWhatsapp(toDigits: string, body: string): Promise<boolean> {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) return false;
  const to = `whatsapp:${toE164Iraq(toDigits)}`;
  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  return twilioSend(to, fromAddr, body);
}

async function sendSms(toDigits: string, body: string): Promise<boolean> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) return false;
  const to = toE164Iraq(toDigits);
  return twilioSend(to, from, body);
}

interface SendResetCodeArgs {
  method: "email" | "phone" | "none";
  destination: string;
  code: string;
  name: string;
  ar: boolean;
}

/** True once at least one real delivery channel has its env vars filled in. */
export function isDeliveryConfigured(method: "email" | "phone" | "none"): boolean {
  if (method === "email") return !!process.env.RESEND_API_KEY;
  if (method === "phone") {
    const hasTwilioAuth = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;
    return hasTwilioAuth && (!!process.env.TWILIO_FROM_NUMBER || !!process.env.TWILIO_WHATSAPP_FROM);
  }
  return false;
}

/**
 * Sends the code and reports whether it was actually handed off to a
 * provider. When `false`, no email/SMS/WhatsApp integration is configured
 * on the server — the caller (see `passwordReset.ts`) uses this to fall
 * back to showing the code directly in the UI so the reset flow keeps
 * working even before an admin sets up real credentials.
 */
export async function sendResetCode({ method, destination, code, name, ar }: SendResetCodeArgs): Promise<boolean> {
  if (method === "none" || !destination) {
    warnUndelivered("password-reset", `No email/phone on file for "${name}"`, code);
    return false;
  }

  if (method === "email") {
    const subject = ar ? "رمز استعادة كلمة المرور — طبيبي" : "Your Tabibee password reset code";
    const html = `
      <div style="font-family:sans-serif;padding:24px;color:#0f172a">
        <h2>${ar ? "طبيبي" : "Tabibee"}</h2>
        <p>${ar ? `مرحباً ${name}، رمز استعادة كلمة المرور الخاص بك هو:` : `Hi ${name}, your password reset code is:`}</p>
        <p style="font-size:32px;font-weight:800;letter-spacing:6px">${code}</p>
        <p style="color:#64748b;font-size:13px">${ar ? "صالح لمدة 10 دقائق. إذا لم تطلب هذا، تجاهل الرسالة." : "Valid for 10 minutes. If you didn't request this, ignore this email."}</p>
      </div>`;
    const sent = await sendEmail(destination, subject, html);
    if (!sent) warnUndelivered("password-reset", `Email not delivered to ${destination} (set RESEND_API_KEY)`, code);
    return sent;
  }

  const text = ar
    ? `طبيبي: رمز استعادة كلمة المرور هو ${code} (صالح 10 دقائق)`
    : `Tabibee: your password reset code is ${code} (valid 10 min)`;

  // Try WhatsApp first (far more reliably delivered than SMS in Iraq for
  // most carriers, and free to send once the Twilio number is configured),
  // then fall back to plain SMS if WhatsApp isn't set up or fails.
  const viaWhatsapp = await sendWhatsapp(destination, text);
  if (viaWhatsapp) return true;

  const viaSms = await sendSms(destination, text);
  if (!viaSms) {
    warnUndelivered(
      "password-reset",
      `No SMS/WhatsApp provider configured or delivery failed for ${destination}`,
      code
    );
  }
  return viaSms;
}

function warnUndelivered(scope: string, detail: string, code: string) {
  if (process.env.NODE_ENV === "production") {
    console.error(`[${scope}] ${detail}`);
    return;
  }
  console.warn(`[${scope}] ${detail}. Code:`, code);
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export type VerificationChannel = "email" | "sms" | "whatsapp";

/**
 * Contact verification delivery:
 *  - purpose "email" → email to that inbox
 *  - purpose "phone" → WhatsApp to that phone number
 *
 * Returns which channel was used (or null if nothing was delivered).
 */
export async function sendVerificationCode({
  purpose,
  phone,
  email,
  code,
  name,
  ar,
}: {
  purpose: "email" | "phone";
  /** Digits-only (or local) phone that receives WhatsApp. */
  phone?: string;
  /** Inbox that receives the email verification code. */
  email?: string;
  code: string;
  name: string;
  ar: boolean;
}): Promise<{ delivered: boolean; channel: VerificationChannel | null }> {
  if (purpose === "email") {
    if (!email) {
      warnUndelivered("verify", `No email on file for "${name}"`, code);
      return { delivered: false, channel: null };
    }
    const subject = ar ? "رمز تأكيد البريد — طبيبي" : "Your Tabibee email verification code";
    const html = `
      <div style="font-family:sans-serif;padding:24px;color:#0f172a">
        <h2>${ar ? "طبيبي" : "Tabibee"}</h2>
        <p>${ar ? `مرحباً ${name}، رمز تأكيد بريدك هو:` : `Hi ${name}, your email verification code is:`}</p>
        <p style="font-size:32px;font-weight:800;letter-spacing:6px">${code}</p>
        <p style="color:#64748b;font-size:13px">${ar ? "صالح لمدة 10 دقائق. إذا لم تطلب هذا، تجاهل الرسالة." : "Valid for 10 minutes. If you didn't request this, ignore this email."}</p>
      </div>`;
    const sent = await sendEmail(email, subject, html);
    if (sent) return { delivered: true, channel: "email" };
    warnUndelivered("verify", `Email not delivered to ${email} (set RESEND_API_KEY)`, code);
    return { delivered: false, channel: null };
  }

  if (!phone) {
    warnUndelivered("verify", `No phone on file for "${name}"`, code);
    return { delivered: false, channel: null };
  }

  const text = ar
    ? `طبيبي: رمز تأكيد رقم الهاتف هو ${code} (صالح 10 دقائق)`
    : `Tabibee: phone verification code is ${code} (valid 10 min)`;
  const viaWhatsapp = await sendWhatsapp(phone, text);
  if (viaWhatsapp) return { delivered: true, channel: "whatsapp" };
  warnUndelivered("verify", `WhatsApp not configured or failed for ${phone}`, code);
  return { delivered: false, channel: null };
}

/** WhatsApp, then SMS, then email. Returns true when a provider accepted the message. */
export async function deliverPatientReminder(input: {
  phone?: string | null;
  email?: string | null;
  text: string;
  subject: string;
}): Promise<boolean> {
  let delivered = false;
  if (input.phone) {
    delivered = (await sendWhatsapp(input.phone, input.text)) || (await sendSms(input.phone, input.text));
  }
  if (input.email) {
    const html = `<div style="font-family:sans-serif;padding:24px;color:#0f172a"><p>${input.text}</p></div>`;
    delivered = (await sendEmail(input.email, input.subject, html)) || delivered;
  }
  return delivered;
}

export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

export function isWhatsappConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );
}
