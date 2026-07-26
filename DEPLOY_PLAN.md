# Deploy the GHCR-built image to Railway (build once, promote the artifact)

## Context

The pipeline builds a Docker image and pushes it to `ghcr.io/cbunna/github-action-env` in `build-and-push`, but the `deploy` job originally never used it — `bervProject/railway-deploy` ran `railway up`, which re-uploads checked-out source and has Railway build it again from scratch (confirmed by reading its `entrypoint.sh`). That meant every deploy built the app twice, in two different environments, with no guarantee the image tested/pushed in CI was the one that actually ended up running.

The fix: make Railway deploy the exact image that was built and pushed in `build-and-push`, and have the `deploy` job simply tell Railway "redeploy the container that's already sitting in GHCR" instead of rebuilding from source. This is the standard "build once, promote the artifact through every stage" CI/CD pattern.

The GHCR package was private; rather than requiring Railway's Pro plan for private-registry credentials, we made the package public (one-time, free, manual step) so Railway can pull it without extra auth.

## Steps

1. **Make the GHCR package public** — *manual, one-time, still needs to be done*
   - On GitHub: repo → **Packages** → `github-action-env` → **Package settings** → **Change visibility** → Public.

2. **Add a stable `latest` tag to the image** — *done* ([pipeline.yml](.github/workflows/pipeline.yml) `Extract metadata` step)
   ```yaml
   tags: |
       type=sha,prefix=
       type=raw,value={{date +%Y%m%d}}
       type=raw,value=latest
   ```
   The sha/date tags stay for traceability in the registry; `latest` is what Railway's service source points at.

3. **Point the Railway service at the image** — *manual, one-time, still needs to be done*
   - Railway dashboard → service → **Settings** → **Source** → change from GitHub repo to **Docker Image** → `ghcr.io/cbunna/github-action-env:latest`.

4. **Replace the `deploy` job's build-from-source step with a redeploy trigger** — *done* ([pipeline.yml](.github/workflows/pipeline.yml) `deploy` job)
   - Dropped the `actions/checkout@v4` step — the deploy job no longer needs source.
   - Replaced `bervProject/railway-deploy@main` with the Railway CLI, reusing the existing secrets (no new secrets needed):
     ```yaml
     steps:
         - name: Install Railway CLI
           run: npm i -g @railway/cli

         - name: Redeploy on Railway
           run: railway redeploy -y --service ${{ secrets.RAILWAY_SERVICE_ID }}
           env:
               RAILWAY_TOKEN: ${{ secrets.RAILWAY_API_TOKEN }}
     ```
   - Kept the `Smoke Check Health Endpoint` step as-is — it still has a placeholder URL (`https://your-app.up.railway.app/health`), a separate known TODO not covered here.

5. **`build-and-push`'s `outputs.image_tag`** — left as dead code for now; no longer consumed since deploy no longer prints it. Optional cleanup, not required.

## Verification

- Push to `main` (or open a PR to review the diff first).
- Watch `build-and-push`: confirm it pushes three tags (sha, date, `latest`) to GHCR — check the job summary or the `github-action-env` package page.
- Watch `deploy`: confirm `railway redeploy` succeeds (no source upload/build logs — should be fast since it's just pulling the pre-built image).
- In Railway dashboard: confirm the new deployment shows source `ghcr.io/cbunna/github-action-env:latest` and a recent deploy timestamp matching the GHA run.
- Hit the deployed app's `/health` endpoint manually (smoke-check URL is still a placeholder, so this needs a manual check for now).

## Outstanding manual steps

- [ ] Make the GHCR package public
- [ ] Point Railway service source at `ghcr.io/cbunna/github-action-env:latest`
- [ ] Replace the placeholder health-check URL with the real Railway domain
