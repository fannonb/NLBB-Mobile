# NLBB CI/CD Setup

This project now has a release flow split by app surface:

## 1. Mobile app

Workflows:

- `.github/workflows/ci.yml`
  - validates mobile, web, and backend code in the workspace
- `.github/workflows/mobile-preview-build.yml`
  - on every push to `main`, queues an Expo cloud Android APK build
  - can also be run manually
- `.github/workflows/mobile-production-build.yml`
  - manual production Android build trigger

Required GitHub secret:

- `EXPO_TOKEN`

Recommended behavior:

- Push to `main` for a fresh preview APK in Expo cloud
- Use the manual production workflow when you want a release build intentionally

## 2. Admin web app

Repo: `NLBB_Admin`

Workflow:

- `web/.github/workflows/ci.yml`
  - builds the web app on pull requests and on pushes to `main`
  - optionally triggers a Vercel deploy hook if configured

Required GitHub secret if you want hook-based deploys:

- `VERCEL_DEPLOY_HOOK_URL`

Notes:

- If Vercel Git integration is already connected, pushing to `main` is enough for live deploys
- The deploy hook is only a fallback or force-deploy path

## 3. Backend API

Repo: `NLBB-Backend`

Workflow:

- `backend/.github/workflows/ci.yml`
  - runs backend typecheck and build on pull requests and pushes to `main`

Deployment:

- Render is already configured to auto-deploy from `main`
- `backend/render.yaml` now carries the expected production environment structure

## GitHub secrets checklist

Mobile repo:

- `EXPO_TOKEN`

Admin web repo:

- `VERCEL_DEPLOY_HOOK_URL` (optional if Vercel Git integration is enough)

Backend repo:

- no GitHub Actions secret required for deployment if Render stays connected directly to GitHub
- if you later want deploy hooks too, add `RENDER_DEPLOY_HOOK_URL`

## Practical release flow

1. Commit and push backend changes to `main` in `NLBB-Backend`
2. Render auto-deploys the backend
3. Commit and push admin web changes to `main` in `NLBB_Admin`
4. Vercel auto-deploys the admin web app
5. Commit and push mobile changes to the mobile repo `main`
6. GitHub Actions queues a fresh Expo preview APK automatically

## Remaining setup you still need in GitHub

1. Add `EXPO_TOKEN` to the mobile repository Actions secrets
2. Optionally add `VERCEL_DEPLOY_HOOK_URL` to `NLBB_Admin`
3. Make sure the mobile code is pushed to its own GitHub repo so the workflows can actually run
