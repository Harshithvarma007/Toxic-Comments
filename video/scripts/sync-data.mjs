// Pulls the real numbers into the video: metrics from the website's metrics.json (itself generated
// from the exported model), and real model scores for the demo comments from a running API.
//   node scripts/sync-data.mjs [http://127.0.0.1:8000]
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const api = process.argv[2] ?? "http://127.0.0.1:8000";
copyFileSync("../web/content/metrics.json", "src/data/metrics.json");
const { comments } = JSON.parse(readFileSync("../web/content/demo-comments.json", "utf8"));
const out = {};
for (const profile of ["balanced", "strict"]) {
  const r = await fetch(`${api}/v1/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: comments.map((c) => c.text), profile }),
  });
  if (!r.ok) throw new Error(`API ${r.status}`);
  out[profile] = (await r.json()).results.map((x, i) => ({ ...comments[i], ...x }));
}
writeFileSync("src/data/demo.json", JSON.stringify(out, null, 2));
console.log(`demo: ${out.strict.filter((c) => c.toxic).length}/${comments.length} filtered (strict), ${out.balanced.filter((c) => c.toxic).length} (balanced)`);
