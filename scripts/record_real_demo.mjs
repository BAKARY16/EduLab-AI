import { chromium } from "playwright";
import { mkdir, readFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "output", "presentation", "real-demo");
await mkdir(out, { recursive: true });
const port = 3000;
const base = `http://127.0.0.1:${port}`;
const stamp = Date.now();
const email = `demo-video-${stamp}@example.com`;
const password = `EduLabDemo${String(stamp).slice(-6)}A1`;
const envText = await readFile(path.join(root, ".env.local"), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter(line => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line)).map(line => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
}));
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const server = null;

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Le serveur Next.js n'a pas démarré.");
}

const browser = await chromium.launch({ headless: true });

const pause = (ms = 1600) => new Promise((resolve) => setTimeout(resolve, ms));

async function clickVisible(page, locator, wait = 1500) {
  const target = locator.first();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
    await pause(350);
  }
  await target.click();
  await pause(wait);
}

async function setupAccount() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/auth/signup`, { waitUntil: "networkidle" });
  await page.locator('input[name="name"]').fill("Aminata Démo");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/onboarding/, { timeout: 30000 }),
    page.getByRole("button", { name: /Créer mon compte/i }).click(),
  ]);
  await pool.query(`update profiles set level='Lycée', grade='Terminale D', cycle='BAC', difficult_subjects='Mathématiques', goals='Réussir mon examen', preferred_language='Français', learning_style='visuel', exam_class=true, onboarding_completed=true, updated_at=now() from users where profiles.user_id=users.id and users.email=$1`, [email]);
  await context.close();
}

async function cleanupAccount() {
  const result = await pool.query("select id from users where email=$1 limit 1", [email]);
  const id = result.rows[0]?.id;
  if (id) {
    await pool.query("delete from users where id=$1", [id]);
    await supabase.auth.admin.deleteUser(id).catch(() => undefined);
  }
}

async function recordDemo() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: out, size: { width: 1920, height: 1080 } },
  });
  await context.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "edulab-demo-cursor";
      Object.assign(cursor.style, {
        position: "fixed", width: "24px", height: "24px", borderRadius: "999px",
        border: "3px solid #ef9a42", background: "rgba(239,154,66,.2)",
        pointerEvents: "none", zIndex: "2147483647", transform: "translate(-50%,-50%)",
        boxShadow: "0 0 0 5px rgba(255,255,255,.75)", transition: "width .12s,height .12s",
      });
      document.documentElement.appendChild(cursor);
      document.addEventListener("mousemove", (event) => {
        cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`;
      });
      document.addEventListener("mousedown", () => { cursor.style.width = "38px"; cursor.style.height = "38px"; });
      document.addEventListener("mouseup", () => { cursor.style.width = "24px"; cursor.style.height = "24px"; });
    });
  });
  const page = await context.newPage();
  const video = page.video();
  await page.goto(`${base}/auth/login`, { waitUntil: "networkidle" });
  await pause(2200);
  await page.locator('input[name="email"]').fill(email);
  await pause(500);
  await page.locator('input[name="password"]').fill(password);
  await pause(800);
  await Promise.all([
    page.waitForURL(/\/app/, { timeout: 30000 }),
    clickVisible(page, page.getByRole("button", { name: /Se connecter/i }), 0),
  ]);
  await page.waitForLoadState("networkidle");
  await pause(3500);

  await clickVisible(page, page.locator('a[href="/app/cours"]'), 2500);
  const explorerButtons = page.locator("section button");
  for (let level = 0; level < 4; level++) {
    if (await explorerButtons.count()) await clickVisible(page, explorerButtons.last(), 1300);
  }
  await pause(2500);

  await clickVisible(page, page.locator('a[href="/app/ia"]'), 3000);
  const questionInput = page.locator('textarea, input[placeholder*="question" i]').last();
  if (await questionInput.count()) {
    await questionInput.fill("Explique-moi simplement la loi d’Ohm.");
    await pause(1200);
  }

  await clickVisible(page, page.locator('a[href="/app/labo"]'), 2200);
  const firstLab = page.locator('a[href^="/app/labo/"]').first();
  if (await firstLab.count()) {
    await clickVisible(page, firstLab, 2500);
    const slider = page.locator('input[type="range"]').first();
    if (await slider.count()) {
      await slider.focus();
      await slider.press("ArrowRight"); await slider.press("ArrowRight"); await slider.press("ArrowRight");
      await pause(2500);
    }
  }

  await clickVisible(page, page.locator('a[href="/app/examens"]'), 2500);
  const firstExam = page.locator('a[href^="/app/examens/"]').first();
  if (await firstExam.count()) await clickVisible(page, firstExam, 2500);

  await clickVisible(page, page.locator('a[href="/app/suivi"]'), 3000);
  await clickVisible(page, page.locator('a[href="/app"]'), 3000);
  await context.close();
  const source = await video.path();
  const target = path.join(out, "real-platform-demo.webm");
  if (path.resolve(source) !== path.resolve(target)) await rename(source, target);
  return target;
}

try {
  await waitForServer();
  await setupAccount();
  const video = await recordDemo();
  console.log(JSON.stringify({ video, email }));
} finally {
  await browser.close().catch(() => {});
  await cleanupAccount().catch(() => {});
  await pool.end().catch(() => {});
  server?.kill();
}
