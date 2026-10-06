// Routes classify requests from content scripts to the on-device model (offscreen document)
// or to the cloud API, and keeps the per-tab "filtered" badge.
import { getSettings } from "./settings.js";

const OFFSCREEN = "offscreen.html";
let creating = null;

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
  if (contexts.length) return;
  creating ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN,
      reasons: ["WORKERS"],
      justification: "Run the toxicity model (WebAssembly) on-device.",
    })
    .finally(() => (creating = null));
  await creating;
}

async function classifyLocal(texts, profile) {
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({ target: "offscreen", type: "classify", texts, profile });
  if (res?.error) throw new Error(res.error);
  return res.results;
}

async function classifyCloud(texts, profile, apiUrl) {
  const out = [];
  for (let i = 0; i < texts.length; i += 64) {
    const r = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: texts.slice(i, i + 64), profile }),
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    out.push(...(await r.json()).results);
  }
  return out;
}

const counts = new Map(); // tabId -> filtered count

function setBadge(tabId) {
  const n = counts.get(tabId) ?? 0;
  chrome.action.setBadgeBackgroundColor({ tabId, color: "#e54d62" });
  chrome.action.setBadgeText({ tabId, text: n ? String(n > 999 ? "999+" : n) : "" });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.target !== "background") return;
  const tabId = sender.tab?.id;

  if (msg.type === "classify") {
    (async () => {
      const s = await getSettings();
      try {
        const results =
          s.backend === "cloud" ? await classifyCloud(msg.texts, s.profile, s.apiUrl) : await classifyLocal(msg.texts, s.profile);
        sendResponse({ results });
      } catch (e) {
        sendResponse({ error: String(e?.message ?? e) });
      }
    })();
    return true;
  }
  if (msg.type === "count" && tabId !== undefined) {
    counts.set(tabId, msg.filtered);
    setBadge(tabId);
  }
  if (msg.type === "stats") {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => sendResponse({ filtered: counts.get(tab?.id) ?? 0 }));
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => counts.delete(tabId));

// Load the model as soon as the extension starts so the first video page is fast.
chrome.runtime.onStartup.addListener(() => getSettings().then((s) => s.backend === "local" && ensureOffscreen()));
chrome.runtime.onInstalled.addListener(() => ensureOffscreen().then(() => chrome.runtime.sendMessage({ target: "offscreen", type: "warmup" })));
