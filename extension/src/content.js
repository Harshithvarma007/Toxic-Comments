// Finds YouTube comments as they load, sends them for scoring in batches, and blurs or hides
// the toxic ones. Scores are cached per comment text so re-renders and SPA navigation are free.
import { getSettings } from "./settings.js";

const TEXT_SELECTOR = [
  "ytd-comments #content-text", // desktop (ytd-comment-view-model and legacy ytd-comment-renderer)
  "ytm-comment-renderer .comment-text", // m.youtube.com
].join(",");
const CONTAINER_SELECTOR = "ytd-comment-view-model, ytd-comment-renderer, ytm-comment-renderer";
const LABEL_NAMES = {
  toxic: "toxic",
  severe_toxic: "severely toxic",
  obscene: "obscene",
  threat: "threat",
  insult: "insult",
  identity_hate: "identity hate",
};

let settings = null;
let scores = new Map(); // normalised text -> result
const pending = new Map(); // normalised text -> Set<element>
let flushTimer = null;
let inFlight = false;

const norm = (t) => t.replace(/\s+/g, " ").trim();

function apply(el, result) {
  const container = el.closest(CONTAINER_SELECTOR) ?? el;
  el.classList.remove("tcf-blur");
  container.classList.remove("tcf-hide");
  container.querySelector(":scope .tcf-note")?.remove();
  if (!result?.toxic || settings.mode === "off" || el.dataset.tcfRevealed === "1") return;

  if (settings.mode === "hide") {
    container.classList.add("tcf-hide");
    return;
  }
  el.classList.add("tcf-blur");
  const note = document.createElement("div");
  note.className = "tcf-note";
  const why = result.labels.map((l) => LABEL_NAMES[l] ?? l).join(", ");
  note.textContent = `Hidden by Toxic Filter · ${why} `;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Show";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    el.dataset.tcfRevealed = "1";
    apply(el, result);
  });
  note.append(btn);
  el.after(note);
}

function updateBadge() {
  let filtered = 0;
  for (const el of document.querySelectorAll(TEXT_SELECTOR)) {
    if (scores.get(el.dataset.tcfText)?.toxic) filtered++;
  }
  chrome.runtime.sendMessage({ target: "background", type: "count", filtered: settings.mode === "off" ? 0 : filtered });
}

async function flush() {
  flushTimer = null;
  if (inFlight || pending.size === 0) return;
  inFlight = true;
  const batch = [...pending.keys()].slice(0, 32);
  const elements = batch.map((t) => pending.get(t));
  batch.forEach((t) => pending.delete(t));
  try {
    const res = await chrome.runtime.sendMessage({ target: "background", type: "classify", texts: batch });
    if (res?.error) throw new Error(res.error);
    res.results.forEach((r, i) => {
      scores.set(batch[i], r);
      elements[i].forEach((el) => el.dataset.tcfText === batch[i] && apply(el, r));
    });
    updateBadge();
  } catch (e) {
    console.warn("[toxic-filter]", e.message);
  } finally {
    inFlight = false;
    if (pending.size) flushTimer = setTimeout(flush, 0);
  }
}

function scan(root = document) {
  if (!settings) return;
  for (const el of root.querySelectorAll(TEXT_SELECTOR)) {
    const text = norm(el.textContent ?? "");
    if (!text) continue;
    if (el.dataset.tcfText !== text) {
      // New comment, or YouTube recycled this element for a different one.
      el.dataset.tcfText = text;
      delete el.dataset.tcfRevealed;
      apply(el, null);
    } else if (el.dataset.tcfApplied === settings.mode + settings.profile) {
      continue;
    }
    const known = scores.get(text);
    if (known) {
      apply(el, known);
      el.dataset.tcfApplied = settings.mode + settings.profile;
    } else {
      if (!pending.has(text)) pending.set(text, new Set());
      pending.get(text).add(el);
      el.dataset.tcfApplied = settings.mode + settings.profile;
    }
  }
  if (pending.size && !flushTimer) flushTimer = setTimeout(flush, 150);
}

const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.addedNodes.length || m.type === "characterData") {
      clearTimeout(scan.t);
      scan.t = setTimeout(() => scan(), 200);
      return;
    }
  }
});

chrome.storage.onChanged.addListener(async (changes) => {
  const rescore = "profile" in changes || "backend" in changes || "apiUrl" in changes;
  settings = await getSettings();
  if (rescore) scores = new Map();
  for (const el of document.querySelectorAll(TEXT_SELECTOR)) delete el.dataset.tcfApplied;
  scan();
  updateBadge();
});

(async () => {
  settings = await getSettings();
  scan();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
