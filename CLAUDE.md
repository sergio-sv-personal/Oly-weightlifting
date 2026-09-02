# Notes for future Claude agents

This is Sergio's Olympic weightlifting training log — a static React + Vite site that catalogues lift videos (mostly YouTube Shorts) with notes, tags, and per-set comments. Sergio asks Claude to add new entries and tweak the UI.

Live: https://oly-weightlifting.vercel.app/

## Tech stack

- **Vite + React 18** — single-file UI in `src/App.jsx` (deliberate; don't split unless asked).
- **`@supabase/supabase-js`** — comments backend. Publishable key in `src/supabase.js`; safe in the browser.
- **`lucide-react`** — icons.
- **No CSS framework.** All styles are inline JS objects in `App.jsx`. Match the existing aesthetic (mono font for meta/labels, display font for weights/titles, accent color `#E94E1B`, dark surface).
- **Vercel** — auto-deploys `main`.

## Files

- `src/App.jsx` — the entire UI. Big file; use targeted `Edit`s, not `Write`.
- `src/videos.json` — canonical lift manifest. Source of truth for cards.
- `src/dayNotes.json` — optional per-day notes, keyed by date (`"2026-05-23": "..."`). Renders as a full-width "Session note" banner at the top of that day's content (inside the collapse). Use for whole-session context (felt off, cut short, deload, etc.) that doesn't belong to a single lift.
- `src/crossfitSessions.json` — optional CrossFit (or any class workout) bundle for a date. Shape: `{ "YYYY-MM-DD": { className, time, week, cycle, location, strength: [{ name, scheme, myWeight }], metcon: { format, details, scoreType, timeCap }, notes } }`. The `week`/`cycle`/`location` fields (e.g. `"week-3-c2"`, `"cycle-2"`, `"loc-brunswick"`) let the day be filtered by the existing chips and slot into the right week separator. Renders as a collapsible class card at the top of the day's content. If a date appears here but not in `videos.json`, it still renders as a day section (without a "Day N" label — CrossFit-only days don't shift the OWL day numbering). **Skip the `accessories` field for CrossFit** — Sergio doesn't do the class accessory work; logging them is just noise.
- `src/whoopDays.json` — per-day readiness data from Sergio's Whoop export, keyed by wake date: `{ recovery, rhr, hrv, sleepPerf, sleepMin, strain }`. Renders as (a) a color-coded recovery pill on the day header and (b) a "Whoop" stat strip at the top of the expanded day. Recovery color bands follow Whoop's convention: green ≥67, yellow 34–66, red <34. To refresh, Sergio uploads a new `my_whoop_data_*.zip`; regenerate from `physiological_cycles.csv`, keying each cycle by the **wake-onset date** (that's the day the recovery score applies to). Keep the from-date around 2026-05-01 to bound file size.
- `src/program.json` — the prescribed program, extracted from the coach's spreadsheet (`Sergio_Suarez.xlsx`, sheet `110526` = the block starting 11 May 2026). Weeks run horizontally in that sheet in 25-column blocks; each exercise is a 3-row group (%, target kg, reps) with a notes row. Renders on the **Coach summary** view (tab next to "Training log") along with the Trends bar charts. To refresh, Sergio uploads a new xlsx; re-run the extraction (script pattern is in the git history of the PR that added this).
- `src/maxes.json` — 1RM history per main lift: `{ lift_key: { label, history: [{ date, kg, ref? }] } }`. Renders as the "Max lifts" board at the top of the Coach summary (bar scaled to the heaviest lift, previous max as a tick, delta chip). When Sergio reports a new tested max, **append** to that lift's history (don't replace) — the board shows last → current. `ref: true` marks values taken from the coach's program sheet rather than an actual test day.
- `src/nutrition.json` — the food log, rendered on the **Fuel** tab. Shape: `{ targets: { kcalLow, kcalHigh, carbsG, proteinG, fibreLowG, fibreHighG }, days: { "YYYY-MM-DD": { training, fluidsMl, closed, note?, items: [{ name, kcal, p, c, f, fibre, slot? }] } } }`. `slot` is one of `pre | intra | post | veg | fruit | supp` and drives the protocol-adherence row (pre/intra/post are Seb's training-window carbs; veg/fruit his daily habits; supp = pre-workout / night stack, not shown as a tag). `closed: false` marks a day still being logged — it draws as a dashed outline in the chart and shows "so far". Sergio logs food item by item during the day; append to that day's `items`, update `fluidsMl`, and set `closed: true` after the night stack. Label values where a package exists; mark estimates in the item name. The older markdown ledgers in `docs/nutrition/` are the archive of the first tracked weeks.
- `src/weightDays.json` — morning weigh-ins from Sergio's RENPHO scale, `{ "YYYY-MM-DD": kg }`, first reading of each day, from 28 Jan 2025 (the 103.6kg peak). Refresh from a new `RENPHO_HealthSergio.csv` export (newest-first; columns Date `YYYY.MM.DD`, Time, Weight(kg)).
- `src/supabase.js` — Supabase client + keys.
- `src/main.jsx`, `index.html` — Vite bootstrap.
- `netlify.toml`, `vercel.json` — deploy configs.

## Adding a new video — the main workflow

Sergio pastes a YouTube URL plus a short description (lift, weight, set, notes). Your job:

1. **Parse the URL.**
   - `youtube.com/shorts/{id}` → vertical Short. Set `"vertical": true`.
   - `youtu.be/{id}` or `youtube.com/watch?v={id}` → landscape. Omit `vertical`.
   - The `{id}` becomes `youtubeId`.
   - If Sergio sends a `photos.google.com` or `photos.app.goo.gl` link, **stop** — Google Photos can't be embedded. Ask him to upload to YouTube (Unlisted).

2. **Confirm you have:** lift type, weight (kg), date, set number if part of a working set, Sergio's notes.

3. **Translate notes to OWL (Olympic weightlifting) terminology.** Sergio asks for this explicitly. Examples seen in this repo:
   - "not getting under fast" → "not pulling under the bar quickly / low enough"
   - "hip shoots up first" → "hips rise before shoulders, compromising back angle"
   - "not jumping high enough to extend" → "incomplete drive; not finishing triple extension at the hips"
   - "bar drifts forward" → "bar travels off midfoot / forward of vertical"
   - "leg drive weak on push press" → "leg drive incomplete; arms take over before legs finish"
   - "lockout could be better" → "lockout incomplete — elbows not fully extending overhead"
   - "didn't respect the vertical on the dip" → "dip drifts forward of vertical"

4. **Check the lift type.** If the lift key isn't in `LIFT_LABELS` in `src/App.jsx`, add it. Key is snake_case; value is the display name. Also add the lift to `LIFT_CATEGORIES` so it shows up in the right movement-family group in the Lift filter. Categories: `snatch`, `clean_jerk`, `squat_pull`, `accessory`. The chip filter renders these as subheaders under the Lift row.

5. **Append an entry to `src/videos.json`.** Schema:

   ```json
   {
     "id": "v{N}",
     "youtubeId": "abc123",
     "vertical": true,
     "title": "Lift name, set N",
     "date": "2026-MM-DD",
     "lift": "lift_type_key",
     "weight": 50,
     "bodyweight": 100,
     "tags": ["week-N", "working-set", "..."],
     "notes": "OWL-translated note."
   }
   ```

   `id`: increment from the highest existing `v{N}`. It only needs to be unique. Comments key on `youtubeId`, not `id`.

   `bodyweight`: optional (kg). When set, the card and modal display the lift's percentage of bodyweight (e.g. "60% BW") alongside the absolute weight. Omit if unknown.

   `summary`: optional. Set on the **top entry** of a multi-set group (highest weight, first in array order). When present, the card preview uses this instead of the entry's own `notes`, so the coach reads one sentence describing the whole working set rather than the top set's specific note. Skip for single-set groups. Update the summary on the top entry whenever you add/remove sets in the group — and when the top changes (heavier set added), move/rewrite the summary on the new top.

   `accessory`: optional boolean. When true, the entry renders in a separate "Accessories" sub-grid below the day's main lifts, with muted styling and a smaller card. Use for bodyweight accessory work (dips, pull-ups, etc.) and machine work that isn't the focus of the session.

   `reps`: optional number. Per-set rep count. Surfaces on accessory cards as "N×reps" beside the BW badge.

   `sets`: optional number. Use **only** on a single videoless entry that represents an entire accessory exercise's volume (e.g. one entry with `sets: 3, reps: 5, no youtubeId` represents 3×5 pull-ups that weren't filmed). For recorded entries (one entry per set), omit `sets` — the grid counts entries instead.

   **Videoless logged entries.** Omit `youtubeId`. The card hides the Play footer and shows "Logged · no video"; clicking the card does nothing. Use this only for accessory volume you want logged but didn't record.

6. **Array position matters within a group.** Cards group by `(lift, date)`. Inside a group, sets sort by weight descending; same-weight sets preserve **array order**. Sergio's convention is "most recent set at the top of the modal." So if a working set at 50kg already has set 4, set 3 in that order, place new set 2 **after** them in the JSON.

7. **Tags use kebab-case.** Three categories have dedicated filter rows and prefixes — keep these conventions:
   - **Week:** `week-N` or `week-N-c{cycle}` (e.g. `week-12-c1`). The `-cN` suffix is optional and only used when the cycle is known; the UI parses it for the chip label ("Week 12 — C1"). Always include the week.
   - **Cycle:** `cycle-N` (e.g. `cycle-1`). Separate tag from the cycle suffix on the week tag. Both should be present when known.
   - **Location:** `loc-{name}` (e.g. `loc-brunswick`). The UI capitalises the first letter for display.
   - Session role: `primer` (warmup/activation), `working-set` (main work), `heavy` (top-end/max-effort).
   - Focus: `technique`.
   - Context: `rack`, `split`, `raised`, `complex`, `btk-hang`, `dip-drive`, `lockout`.

8. **Commit, push, PR, merge.** See the git workflow section.

## Lift card / modal grouping (don't break this)

- Cards in the grid are one per `(lift, date)` group, not one per video.
- Each card shows: lift name, date, top weight (largest), set count, "also Xkg" if multiple weights, deduped tags, notes preview from top set, "▶ Play N sets" footer (accent color — the visual affordance that the card opens video content).
- Clicking the card opens a modal that stacks every set in the group, heaviest first. Each set has its own video, notes, tags, Supabase comments thread, "Open on YouTube" link.

If Sergio asks to change the grouping logic, fine — but check with him before changing the `(lift, date)` key.

## Comments (Supabase)

- Table `public.comments`. Columns: `id uuid`, `video_youtube_id text`, `author text`, `body text`, `created_at timestamptz`.
- RLS policies: anyone can `select`, anyone can `insert`. Length checks: `author` 1–50, `body` 1–2000.
- Threads key on `youtubeId` of the per-set video. Per-set granularity intentional — Seb (the coach) leaves feedback at the set level.
- `src/supabase.js` holds a **publishable** key (`sb_publishable_...`). This is safe for the browser by design; do not move it to env vars unless asked.
- If you need to recreate the schema, the idempotent SQL is in the chat history (or write it again — it's straightforward).

## Comment notifications (Resend)

- `api/notify-comment.js` is a Vercel serverless function that receives a Supabase Database Webhook on every new comment and sends an email via Resend.
- Env vars (set in the Vercel project): `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_SECRET`.
- The Supabase webhook is configured in **Database → Webhooks** in the Supabase dashboard. Event: `comments` INSERT. URL: `https://oly-weightlifting.vercel.app/api/notify-comment`. Header: `x-notify-secret: <NOTIFY_SECRET>`.
- Sends from `onboarding@resend.dev` (the Resend test sender). To send to addresses other than the account owner, verify a domain in Resend and update the `from` field.

## Git workflow (important quirk)

- Develop on the branch `claude/build-website-9m6qo`. Never push directly to `main` — it's branch-protected (you'll get 403).
- Each change ships via **PR + squash merge** through `mcp__github__create_pull_request` and `mcp__github__merge_pull_request`.
- **Squash merge causes branch divergence.** After every merge, before the next change:
  ```bash
  git fetch origin main
  git reset --hard origin/main
  ```
  Then make your edits, commit, and **force-push** the feature branch:
  ```bash
  git push --force-with-lease origin claude/build-website-9m6qo
  ```
  Without this, the next PR will hit a merge conflict against the squashed `main`.
- `git pull` on the feature branch after a squash merge will diverge; don't bother — use the reset-from-main pattern above.

## Build / verify

- `npm run dev` for local dev (port 5173).
- `npm run build` to verify a change compiles. Bundle is ~108 KB gzipped; flag if it grows materially.
- Sergio runs Vercel; you don't deploy directly. Pushing to `main` (via PR merge) triggers the deploy.

## UI details worth knowing

- Header has a tiny stick-figure SVG animation: three failed snatch attempts to mid-thigh, then on the fourth the arms+bar shape rotates 180° around the shoulders (via `rotateX`) — looks like a pancake flip, ends overhead. CSS keyframes only, no library. If Sergio asks to tune timing, find `@keyframes snatch-attempts` in `globalCss`.
- `scrollbar-gutter: stable` on `html` prevents layout shift when the modal locks body scroll. Don't remove.
- `overscroll-behavior: contain` on the modal backdrop. Don't remove.
- The modal does NOT use `backdrop-filter: blur` — it caused a Safari/iOS paint bug where cards rendered white after closing the modal.

## Style do/don'ts

- **Don't** introduce a CSS framework, styled-components, etc. Inline styles are intentional.
- **Don't** add per-entry `comments` arrays to `videos.json`. Comments live in Supabase.
- **Don't** rename `youtubeId` — the comments table references it by name.
- **Do** match the existing typography: display font (Big Shoulders) for weights/titles, mono (JetBrains Mono) for meta/labels/eyebrow text, body (Geist) for everything else.

## Asking the user vs. just doing it

Sergio iterates fast and prefers you to act, but **pause** when:
- The data looks duplicated (e.g. a YouTube ID matching an existing entry — clarify whether to replace or treat as different video).
- He references a different unit (e.g. "week 2" when previous entries say "week 12" — ask if it's the same).
- A request is ambiguous between "tweak the existing UI" and "redesign" — propose two options.

When you make assumptions (e.g. default date to today), state them in your summary so he can correct.
