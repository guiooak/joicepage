/* Measure a built page's section geometry in headless Chrome.
 *
 *   node tools/measure/measure.mjs <dir> <width> [selector]
 *
 * Serves <dir> over a throwaway HTTP server, opens it at <width> CSS pixels
 * with a mobile-shaped viewport, and prints one row per matched element:
 * its label, its top offset in page coordinates and its height.
 *
 * Offsets are reported UNSCALED — divided back through the zoom factor the
 * page applies — so they compare directly against the numbers drawn in the
 * Figma frame regardless of the width being measured at. That is the whole
 * point: the same table should come out at 360, 390 and 430.
 *
 * No dependencies. It drives Chrome over the DevTools protocol with the
 * WebSocket built into Node 22+, which is why there is no node_modules here.
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname, resolve } from "node:path";

const [dir, widthArg, selector = "body > *, main > *"] = process.argv.slice(2);
if (!dir) {
  console.error("usage: measure.mjs <dir> <width> [selector]");
  process.exit(2);
}
const width = Number(widthArg ?? 360);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

const root = resolve(dir);
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(root, path.endsWith("/") ? path + "index.html" : path);
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}/`;

const profile = await mkdtemp(join(tmpdir(), "measure-"));
const chrome = spawn(
  "google-chrome",
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    `--window-size=${width},900`,
    "--hide-scrollbars=false",
    "--no-first-run",
    "--disable-gpu",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

// Chrome prints the DevTools endpoint on stderr once it is listening.
const wsUrl = await new Promise((res, rej) => {
  let buf = "";
  const t = setTimeout(() => rej(new Error("chrome did not start")), 20000);
  chrome.stderr.on("data", (d) => {
    buf += d;
    const m = buf.match(/ws:\/\/\S+/);
    if (m) {
      clearTimeout(t);
      res(m[0]);
    }
  });
});

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id !== undefined && pending.has(msg.id)) {
    const { resolve: ok, reject: no } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? no(new Error(msg.error.message)) : ok(msg.result);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((ok, no) => {
    const id = ++nextId;
    pending.set(id, { resolve: ok, reject: no });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

await send("Page.enable", {}, sessionId);
// A real mobile viewport: device-width has to report `width`, and
// deviceScaleFactor 1 keeps CSS pixels comparable across runs.
await send(
  "Emulation.setDeviceMetricsOverride",
  { width, height: 900, deviceScaleFactor: 1, mobile: true },
  sessionId,
);

const loaded = new Promise((ok) => {
  const on = (e) => {
    const m = JSON.parse(e.data);
    if (m.sessionId === sessionId && m.method === "Page.loadEventFired") {
      ws.removeEventListener("message", on);
      ok();
    }
  };
  ws.addEventListener("message", on);
});
await send("Page.navigate", { url: origin }, sessionId);
await loaded;
// Let webfonts settle: they change every box height on this page.
await send(
  "Runtime.evaluate",
  { expression: "document.fonts.ready.then(() => 0)", awaitPromise: true },
  sessionId,
);

const expression = `(() => {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;top:0;left:0;width:100px;height:100px";
  document.body.appendChild(probe);
  // The page scales itself with \`zoom\` on body, so a 100px probe inside it
  // measures the factor directly.
  const factor = probe.getBoundingClientRect().width / 100;
  probe.remove();

  const rows = [...document.querySelectorAll(${JSON.stringify(selector)})].map((el) => {
    const r = el.getBoundingClientRect();
    return {
      label: (el.id || el.className || el.tagName.toLowerCase()).toString().trim().split(/\\s+/)[0],
      tag: el.tagName.toLowerCase(),
      top: +((r.top + window.scrollY) / factor).toFixed(2),
      height: +(r.height / factor).toFixed(2),
    };
  });
  return JSON.stringify({
    factor: +factor.toFixed(4),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    pageHeight: +(document.documentElement.scrollHeight / factor).toFixed(2),
    rows,
  });
})()`;

const { result } = await send("Runtime.evaluate", { expression, returnByValue: true }, sessionId);
const out = JSON.parse(result.value);

console.log(`width ${width}  ·  zoom ${out.factor}  ·  page ${out.pageHeight}`);
console.log(
  out.scrollWidth > out.clientWidth
    ? `HORIZONTAL SCROLL: scrollWidth ${out.scrollWidth} > clientWidth ${out.clientWidth}`
    : `no horizontal scroll (scrollWidth ${out.scrollWidth} = clientWidth ${out.clientWidth})`,
);
for (const r of out.rows) {
  console.log(`${r.top.toString().padStart(10)}  ${r.height.toString().padStart(9)}  ${r.tag} .${r.label}`);
}

ws.close();
chrome.kill();
server.close();
// Chrome keeps writing to its profile for a moment after SIGTERM, so the
// rmdir races it. The directory is disposable either way.
await new Promise((r) => setTimeout(r, 300));
await rm(profile, { recursive: true, force: true }).catch(() => {});
