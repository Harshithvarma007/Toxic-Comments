import { DEFAULTS, getSettings } from "./settings.js";

const HINTS = {
  strict: "Child-safe catches at least 90% of toxic comments in validation, so some harmless ones get hidden too.",
  balanced: "Balanced keeps false alarms low. Better for adults who just want the worst comments gone.",
  cloud: "Comment text is sent to the API for scoring. Use this on slow machines.",
  local: "The model runs inside your browser. Comments never leave this device.",
};

async function render() {
  const s = await getSettings();
  for (const seg of document.querySelectorAll(".seg")) {
    for (const b of seg.querySelectorAll("button")) b.setAttribute("aria-pressed", String(s[seg.dataset.key] === b.value));
  }
  const api = document.getElementById("apiUrl");
  api.hidden = s.backend !== "cloud";
  api.value = s.apiUrl;
  document.getElementById("hint").textContent = `${HINTS[s.profile]} ${HINTS[s.backend]}`;
}

for (const seg of document.querySelectorAll(".seg")) {
  seg.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (seg.dataset.key === "backend" && b.value === "cloud") {
      const { apiUrl } = await getSettings();
      const ok = await chrome.permissions.request({ origins: [new URL(apiUrl).origin + "/*"] });
      if (!ok) return;
    }
    await chrome.storage.sync.set({ [seg.dataset.key]: b.value });
    render();
  });
}

document.getElementById("apiUrl").addEventListener("change", async (e) => {
  try {
    const url = new URL(e.target.value);
    if (await chrome.permissions.request({ origins: [url.origin + "/*"] })) {
      await chrome.storage.sync.set({ apiUrl: url.origin });
    }
  } catch {
    e.target.value = (await getSettings()).apiUrl ?? DEFAULTS.apiUrl;
  }
});

chrome.runtime.sendMessage({ target: "background", type: "stats" }).then((r) => {
  document.getElementById("count").textContent = String(r?.filtered ?? 0);
});

// Travelling perimeter glow — same bell profile as the website / NOUS videos.
const PROFILE = [[-68, 0], [-60, 0.24], [-48, 0.47], [-35, 0.74], [-25, 0.95], [0, 1], [25, 0.95], [35, 0.74], [48, 0.47], [60, 0.24], [68, 0]];
const bell = (o) => {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [x0, y0] = PROFILE[i];
    const [x1, y1] = PROFILE[i + 1];
    if (o >= x0 && o <= x1) return y0 + ((y1 - y0) * (o - x0)) / (x1 - x0);
  }
  return 0;
};
const svg = document.getElementById("glow");
const frame = document.getElementById("frame");
const NS = "http://www.w3.org/2000/svg";
function drawGlow(now) {
  const W = frame.offsetWidth;
  const H = frame.offsetHeight;
  const w = W - 1;
  const h = H - 1;
  const per = 2 * (w + h);
  const c0 = ((now / 6000) % 1) * per;
  const edges = [
    [0, w, 0.5, 0.5, 1, 0],
    [w, w + h, W - 0.5, 0.5, 0, 1],
    [w + h, 2 * w + h, W - 0.5, H - 0.5, -1, 0],
    [2 * w + h, per, 0.5, H - 0.5, 0, -1],
  ];
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  svg.replaceChildren();
  const defs = document.createElementNS(NS, "defs");
  svg.append(defs);
  let id = 0;
  for (const c of [c0 - per, c0, c0 + per]) {
    for (const [s0, s1, x, y, dx, dy] of edges) {
      const lo = Math.max(s0, c - 68);
      const hi = Math.min(s1, c + 68);
      if (lo >= hi) continue;
      const g = document.createElementNS(NS, "linearGradient");
      const gid = `g${id++}`;
      const p1 = [x + dx * (lo - s0), y + dy * (lo - s0)];
      const p2 = [x + dx * (hi - s0), y + dy * (hi - s0)];
      Object.entries({ id: gid, gradientUnits: "userSpaceOnUse", x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] }).forEach(([k, v]) => g.setAttribute(k, v));
      for (let s = 0; s <= 9; s++) {
        const stop = document.createElementNS(NS, "stop");
        stop.setAttribute("offset", s / 9);
        stop.setAttribute("stop-color", "rgb(245,192,192)");
        stop.setAttribute("stop-opacity", bell(lo + ((hi - lo) * s) / 9 - c));
        g.append(stop);
      }
      defs.append(g);
      const line = document.createElementNS(NS, "line");
      Object.entries({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: `url(#${gid})`, "stroke-width": 1.5 }).forEach(([k, v]) => line.setAttribute(k, v));
      svg.append(line);
    }
  }
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(drawGlow);
}

render();
requestAnimationFrame(drawGlow);
