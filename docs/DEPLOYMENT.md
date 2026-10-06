# Deployment

Four things ship, and each goes to a different place on purpose.

| Artefact | Where it runs | Why there |
|---|---|---|
| **Model** (`model_quantized.onnx`, ~34 MB) | GitHub Release `model-vX.Y.Z` (+ optional Hugging Face Hub mirror) | One versioned file that every other surface downloads. A number on the model card is the number you get in production. |
| **Website** (`web/`) | Vercel | Static pages + one server route (`/api/classify`) that proxies to the API and keeps the API key server-side. |
| **API** (`api/`) | Google Cloud Run (container) | CPU inference, scale to zero, pay per request, ~2 s cold start. Any container host works: Fly.io, Railway, HF Spaces, ECS. |
| **Extension** (`extension/`) | Chrome Web Store (and a GitHub Release zip for sideloading) | Runs the model on-device by default. It does not need the API at all unless the user switches to cloud mode. |

```
                 ┌────────────── GitHub Release: model-v2.0.0 ──────────────┐
                 │            toxic-model-onnx.tar.gz (34 MB)               │
                 └───────┬───────────────────────┬──────────────────────────┘
                         │ baked into image      │ bundled into zip
                         ▼                       ▼
 browser ──► Vercel (web) ──/api/classify──► Cloud Run (api)      Chrome extension
                                              ▲                    (ONNX Runtime Web,
                       third-party apps ──────┘                     on-device)
```

## What "deployed" means for an AI project like this

Shipping a model is not the same as shipping a web app. The extra pieces are:

1. **A versioned model artefact.** It should be separate from code and immutable once released. Here that's the release tarball plus `metrics.json`. The API reports the model name at `/v1/model` and on every response.
2. **Offline evaluation as a release gate.** `ml/toxicity/export.py` re-evaluates the *quantised* file on the held-out sets and writes `metrics.json`. Don't release a model whose test PR-AUC is below the previous release.
3. **Serving that is boring.** Stateless CPU container, health and readiness probes, request limits, rate limits, an LRU cache and Prometheus metrics. No GPU is needed: a 33M-parameter int8 model does about 7 ms per comment on one CPU core.
4. **Monitoring for drift, not only uptime.** Watch `toxic_comments_total{toxic="true"}` as a share of all comments. A sudden change usually means new slang or a new kind of traffic, not a broken server.
5. **A feedback loop.** This is the roadmap item that turns the demo into a product: opt-in "this was wrong" reports from the extension, then a human review queue, then a monthly retrain, then the release gate.
6. **Privacy by architecture.** The child-safety use case puts children's browsing on the line. That's why the extension defaults to on-device inference and the API stores no text.

## 1. Release the model

```bash
make data && make train-kaggle      # or: make train-local
make export && make sync            # writes api/model, extension/model, web/content/metrics.json
make test                           # API tests against the new model
scripts/package_model.sh            # -> toxic-model-onnx.tar.gz
gh release create model-v2.0.0 toxic-model-onnx.tar.gz --title "Model v2.0.0" --notes-file ml/artifacts/onnx/metrics.json
```

CI and the deploy workflows fetch the model with `scripts/fetch_model.sh model-v2.0.0`.

Optional Hugging Face mirror, if you want a model page:

```bash
huggingface-cli upload Harshithvarma007/toxic-minilm-l12 api/model .
```

## 2. API → Google Cloud Run

One-time setup:

```bash
gcloud projects create toxic-comments-prod
gcloud config set project toxic-comments-prod
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
printf 'replace-with-a-long-random-key' | gcloud secrets create toxic-api-keys --data-file=-
```

Manual deploy from your machine:

```bash
scripts/fetch_model.sh
gcloud run deploy toxic-api --source api --region asia-south1 --allow-unauthenticated \
  --cpu 1 --memory 1Gi --concurrency 40 --min-instances 0 --max-instances 4 \
  --set-secrets TOXIC_API_KEYS=toxic-api-keys:latest
```

Map a domain such as `api.toxic.harshithvarma.in` with `gcloud beta run domain-mappings create`. You can also put Cloud Run behind a load balancer with Cloud Armor if you need a global rate limit.

For automatic deploys, `.github/workflows/deploy-api.yml` deploys on every push to `main` that touches `api/`. Set up Workload Identity Federation (no JSON keys) by following Google's `google-github-actions/auth` guide, then add:
- repo variables `GCP_PROJECT`, `GCP_REGION`, `CORS_ORIGINS`
- repo secrets `GCP_WIF_PROVIDER`, `GCP_DEPLOY_SA`

**Cost:** the free tier covers about 2M requests a month. Beyond that, the demo-scale traffic this site gets costs well under $5 a month.

**Public or keyed?** If `TOXIC_API_KEYS` is set, every call needs `X-API-Key`. The website still works because its proxy adds the key server-side. Extension users in cloud mode would then need a key too, so either leave the API keyless with rate limits (fine for a demo) or issue keys.

## 3. Website → Vercel

```bash
npm i -g vercel
cd web && vercel link
vercel env add TOXIC_API_URL production     # https://api.toxic.harshithvarma.in
vercel env add TOXIC_API_KEY production     # same key as the secret above
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard with **Root Directory = `web`**. Point `toxic.harshithvarma.in` at the project. This replaces the old v0 site on the same domain.

## 4. Extension → Chrome Web Store

1. `git tag v2.0.0 && git push --tags`. The Release workflow builds `toxic-comments-extension.zip`.
2. Register at the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole) (one-time $5).
3. Upload the zip. The store needs:
   - **Single purpose:** "Hides toxic YouTube comments."
   - **Permission justifications:**
     - `storage`: settings.
     - `offscreen`: run the WebAssembly model.
     - `youtube.com` host: read comment text.
     - Optional hosts: only when the user enables cloud mode.
   - **Privacy policy URL:** publish `docs/PRIVACY.md` on the site.
   - **Data usage:** "website content (comment text), processed on-device and not collected".
   - Screenshots: 1280×800 of the demo page and a real YouTube page.
4. Review usually takes from a few days to two weeks. Bundled WASM and no remote code keeps it simple, because MV3 forbids remotely hosted code and nothing here loads any.

## 5. Launch video

```bash
make api &                           # demo scores come from the real model
make video                           # -> video/out/toxic-comments-launch.mp4 (1080p)
cd video && pnpm render:4k           # 4K/60 for YouTube
```

Upload it to YouTube and attach the mp4 to the GitHub release.

## Alternatives considered

- **Render (v1's host):** its free tier sleeps and cold-starts in about 50 s. That's fine for a hobby project and bad for a live demo.
- **Vercel Python Functions for the API:** possible (the bundle is under 100 MB, and Fluid compute reuses instances). It would put everything on one platform. Cloud Run wins on a predictable CPU, a plain Docker image you can run anywhere, and no request-body or duration surprises with batch scoring.
- **Hugging Face Spaces:** free and easy, but public by default and it sleeps after inactivity. Good as a second, "try the model" mirror.
- **GPU serving:** unnecessary at 33M parameters. Revisit if the model grows past about 300M or traffic passes about 100 req/s per instance.
