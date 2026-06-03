# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: ClipFlow

Browser-based professional video editor (CapCut competitor). No mention of CapCut in the UI.

### Features
- **Onboarding modal** — 3-step first-run wizard (platform picker → content length → confirmation) shown once per browser. Stored in localStorage. Placed in `App.tsx` render so it shows on any page.
- **Platform presets** — 8 visual preset cards in CreateProjectDialog (YouTube 16:9, Shorts 9:16, IG Feed 1:1, IG Reels 9:16, TikTok 9:16, Square 1:1, Widescreen HD, 4K); auto-sets aspectRatio + resolution.
- **Project management** — create, rename, delete projects; dashboard with recent projects; ProjectCard shows aspect-ratio-aware thumbnail and platform badge.
- **Timeline editor** — drag-resize clips on multi-track timeline (Video, Audio, Text, Image tracks)
- **Editor — full CapCut-parity rewrite** — 6-tab left panel (Media, Text, Stickers, Filters, Transitions, Audio). Rich 12-preset cinematic filters (Vivid, Fade, Film, B&W, Warm, Cool, Dramatic, Vintage, Dreamy, Neon, Matte, Cinema) as gradient swatches. Text presets (Big Title, Subtitle, Caption, Label, Neon, Minimal, Cinematic, Highlight). Sticker/emoji grid (40 emojis). Visual transitions picker. Audio tab with TTS launcher.
- **Text inspector** — font family (8 options), font size, Bold/Italic/Underline toggles, alignment (L/C/R), text color picker, background color picker, 9-point position grid (tl/tc/tr/ml/mc/mr/bl/bc/br), 7 text animations (fade, slide-up, slide-left, typewriter, bounce, zoom).
- **Video/image inspector** — speed presets (0.25x–4x), flip H/V + rotate 90°/180°, 6 color grading sliders (Brightness, Contrast, Saturation, Temperature, Vignette, Sharpen), background blur toggle, crop preset grid.
- **Audio inspector** — volume slider (0–200%), fade-in duration, fade-out duration, speed control.
- **Functional Split at Playhead** — scissors button splits any clip at the playhead into two clips. Available in header toolbar + timeline toolbar.
- **Duplicate clip** — copies selected clip immediately after original. Available in header + timeline toolbar + inspector.
- **AI Voiceover (TTS)** — `POST /api/openai/tts` uses OpenAI TTS (tts-1 model), 6 voices (alloy/echo/fable/onyx/nova/shimmer), saves mp3 to object storage, adds audio clip to timeline. Creator/Pro plan required.
- **Public referral share page** — `/r/:code` shows referrer stats, milestone progress, and sign-up CTA. No auth required. Backed by `GET /api/referral/public/:code`.
- **Effects system** — new effect keys: `flip-h:1`, `flip-v:1`, `rotate:N`, `vignette:N`, `sharpen:N`, `bg-blur:1`, `temperature:N`, `fade-in:N`, `fade-out:N`. textStyle new fields: `fontFamily`, `italic`, `underline`, `align`, `bgColor`, `position` (9-point), `animation`, `glow`.
- **FFmpeg export upgrades** — hflip/vflip, transpose (rotate), vignette, unsharp (sharpen), colorbalance (temperature/tint), boxblur background, afade (audio fade in/out), atempo audio tempo, text position grid support, bg-blur split/overlay composite.
- **Live preview canvas** — `PreviewCanvas` component renders active clips at `currentTime` using HTML5 `<video>`, `<img>`, `<audio>` elements. CSS `filter: brightness() contrast() saturate()` applied live from `clip.effects[]`. Video elements sync their `currentTime` to the editor playhead. Text clips rendered as overlay `<p>` with shadow. Aspect ratio auto-adjusts per project (16:9 / 9:16 / 1:1 / 4:3).
- **Transitions** — per-clip "Transition In" picker in right properties panel. 9 options: None, Fade, Dissolve, Slide←, Slide→, Zoom In, Zoom Out, Wipe, Flash. Stored in `clip.transition`.
- **Crop / Frame** — per-clip crop preset grid in right properties panel (Original, 16:9, 9:16, 1:1, 4:5, 4:3). Stored in `clip.textStyle.crop`.
- **FFmpeg effects** — Export now applies: `eq=brightness:contrast:saturation` filter, `colorchannelmixer` for opacity, `crop` for aspect ratio presets, `setpts=PTS/factor` for video speed, `atempo` chains for audio speed. Transitions apply `fade=t=in` at clip start. Helpers in `artifacts/api-server/src/routes/export.ts`: `buildEqFilter`, `buildCropFilter`, `buildVideoSpeedFilter`, `buildAudioTempoFilter`, `transitionFadeDuration`.
- **Import Media** — real file uploads to GCS object storage via presigned URLs (`POST /api/storage/uploads/request-url`). Clips saved with `sourceUrl` pointing to `/api/storage/objects/uploads/UUID`.
- **AI Auto Captions** — OpenAI Whisper transcription → text clips dropped onto timeline
- **FFmpeg Export (SSE)** — `POST /api/projects/:id/export` returns `{ jobId }` immediately and starts async FFmpeg. `GET /api/projects/:id/export/:jobId/progress` is an SSE stream that emits `{ status, progress, message, downloadUrl }` every 500ms. Progress parsed from FFmpeg `-progress pipe:2` output (frame/time). Frontend shows a modal dialog with `<Progress>` bar. Job store in `artifacts/api-server/src/lib/exportJobs.ts`.
- **Pricing page** — $2.99 Creator / $7.99 Pro tiers
- **Clerk Auth** — `@clerk/react` ClerkProvider in App.tsx; proxy at `/api/__clerk` (Express middleware `clerkProxyMiddleware.ts` forwards to Clerk FAPI, sets `Clerk-Proxy-Url` header with correct HTTP/HTTPS protocol detection for localhost). Sign-in (`/sign-in`) and sign-up (`/sign-up`) show a static branded form immediately, Clerk's `<SignIn>`/`<SignUp>` overlays once `isLoaded`. `ProtectedRoute` uses `useAuth().isLoaded` / `isSignedIn` — shows spinner while loading, redirects to sign-in if not authenticated.

### Stripe Payments
- Stripe integration uses `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` environment secrets (user declined the Replit Stripe connector).
- Do NOT use the Replit connector system for Stripe — use the secrets directly.
- `artifacts/api-server/src/lib/stripeClient.ts` reads from env vars with Replit connector as fallback.
- Run `pnpm --filter @workspace/scripts run seed-products` after Stripe keys are set to seed Creator ($2.99) and Pro ($7.99) products.

### Critical Notes
- After every codegen run, verify `lib/api-zod/src/index.ts` contains ONLY `export * from "./generated/api";` — no extra exports.
- DB clips table uses `trackIndex` (integer) and `sourceUrl` (text) — NOT `trackId`/`objectPath`.
- `sourceUrl` stored as `/api/storage/objects/uploads/UUID` — strip `/api/storage` prefix to get objectPath for GCS.
- FFmpeg 6.1.2 pre-installed at `/nix/store/.../bin/ffmpeg` — no installation needed.
- Resolution enum: "720p"→1280×720, "1080p"→1920×1080, "4K"→3840×2160.
- GCS private dir accessed via `PRIVATE_OBJECT_DIR` env var.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Storage**: GCS object storage (`@workspace/object-storage`)
- **Video processing**: FFmpeg (`execFile` in `artifacts/api-server/src/routes/export.ts`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
