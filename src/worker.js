// Balvanz Cattle site Worker
// - Static files in /public are served automatically (see wrangler.toml [assets]).
// - This code only runs for requests that don't match a file, e.g. POST /api/contact.
// - Contact form messages are sent with Cloudflare's free send_email binding to the
//   inbox verified in Email Routing (the same inbox stevejr@balvanzcattle.com forwards to).

import { EmailMessage } from "cloudflare:email";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// Remove line breaks so visitor input can't inject email headers
const oneLine = (s, max) => String(s || "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
const isEmail = (s) => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(s);

// RFC 2047 encoding for non-ASCII header text (names, subjects)
const b64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const encHeader = (s) => {
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  const chars = Array.from(s), words = [];
  for (let i = 0; i < chars.length; i += 30) words.push(`=?UTF-8?B?${b64(chars.slice(i, i + 30).join(""))}?=`);
  return words.join("\r\n "); // folded so each encoded word stays under 75 chars
};
const wrap76 = (s) => s.replace(/.{1,76}/g, "$&\r\n");

async function verifyTurnstile(token, secret, ip) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token || "");
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const out = await res.json().catch(() => ({}));
  return out.success === true;
}

async function handleContact(request, env) {
  let fields;
  try {
    fields = await request.formData();
  } catch {
    return json({ ok: false, error: "Couldn't read the form." }, 400);
  }

  // Honeypot: real people never fill this in. Pretend success for bots.
  if (fields.get("company")) return json({ ok: true });

  const name = oneLine(fields.get("name"), 120);
  const email = oneLine(fields.get("email"), 200);
  const phone = oneLine(fields.get("phone"), 40);
  const topic = oneLine(fields.get("topic"), 60) || "General question";
  const message = String(fields.get("message") || "").trim().slice(0, 5000);

  if (!name || !message) return json({ ok: false, error: "Please add your name and a message." }, 400);
  if (!isEmail(email)) return json({ ok: false, error: "Please enter a valid email address." }, 400);

  // Turnstile spam check (skipped until TURNSTILE_SECRET is set)
  if (env.TURNSTILE_SECRET) {
    const passed = await verifyTurnstile(
      fields.get("cf-turnstile-response"),
      env.TURNSTILE_SECRET,
      request.headers.get("CF-Connecting-IP"),
    );
    if (!passed) return json({ ok: false, error: "Spam check failed. Please try again." }, 400);
  }

  const from = env.FROM_ADDRESS;          // e.g. website@balvanzcattle.com
  const to = env.CONTACT_TO;              // your verified Email Routing destination
  const domain = from.split("@")[1];
  const subject = `Website: ${topic} from ${name}`;

  const text = [
    `New message from balvanzcattle.com`,
    ``,
    `Name:  ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "-"}`,
    `Topic: ${topic}`,
    ``,
    message,
    ``,
    `-- Reply to this email to answer ${name} directly.`,
  ].join("\r\n");

  const raw = [
    `From: ${encHeader("Balvanz Cattle Website")} <${from}>`,
    `To: <${to}>`,
    `Reply-To: ${encHeader(name)} <${email}>`,
    `Subject: ${encHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    wrap76(b64(text)),
  ].join("\r\n");

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(from, to, raw));
  } catch (err) {
    console.error("send_email failed:", err && err.message);
    return json({ ok: false, error: "We couldn't send your message right now." }, 502);
  }
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
      return handleContact(request, env);
    }
    // Anything else that isn't a file falls back to the home page's 404 handling
    return env.ASSETS.fetch(request);
  },
};
