// Shared settings schema for the popup, background and content script.
export const DEFAULTS = {
  mode: "blur", // off | blur | hide
  profile: "strict", // balanced | strict (child-safe)
  backend: "local", // local (on-device) | cloud
  apiUrl: "https://api.toxic.harshithvarma.in",
};

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}
