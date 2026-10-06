# Privacy policy: Toxic Comment Filter (browser extension)

_Last updated: 2026-10-06_

**What the extension reads:** the text of comments on youtube.com pages you open, so it can decide whether to blur or hide them.

**On-device mode (the default):** comment text is processed by a model bundled inside the extension. It never leaves your browser. Nothing is collected, stored remotely, or shared.

**Cloud mode (off unless you turn it on):** comment text is sent over HTTPS to the API you configure (by default `api.toxic.harshithvarma.in`) to be scored. The API does not store comment text. It keeps only aggregate counters (for example, how many comments were scored) for monitoring.

**Settings:** your filter mode, level, and backend choice are saved with `chrome.storage.sync`. That means Chrome syncs them across your own signed-in browsers.

**What we never do:** read your history, track you across sites, use analytics or advertising SDKs, or sell data.

**Contact:** open an issue at https://github.com/Harshithvarma007/Toxic-Comments/issues.
