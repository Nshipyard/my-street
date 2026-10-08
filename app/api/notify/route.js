import { promises as fs } from "fs";
import path from "path";

const STORE = path.join(process.cwd(), "data", "subscribers.json");

async function readAll() {
  try {
    const raw = await fs.readFile(STORE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * POST { email, address } -> stores the subscriber locally.
 * This is real persistence on the server. Actually emailing the weekly
 * briefing still needs an email provider (Resend, Postmark, etc.); the
 * record shape is ready for that handoff.
 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  const address = String(body.address || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return Response.json({ ok: false, error: "That email address does not look right." }, { status: 400 });
  }
  const all = await readAll();
  if (!all.some((s) => s.email === email)) {
    all.push({ email, address, createdAt: new Date().toISOString(), status: "subscribed" });
    await fs.writeFile(STORE, JSON.stringify(all, null, 2));
  }
  return Response.json({ ok: true });
}
