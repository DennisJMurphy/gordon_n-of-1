# Gordon — Overall Spec (v0.1)

**Working name:** Gordon  
**Subtitle:** an n-of-1 report tool  
**Repo name:** `gordon_n-of-1`

## 1. Purpose

Gordon helps individuals turn everyday life and personal self-experiments into **privacy-aware, science-compatible episode reports** — without tracking them constantly.

**Core idea:**  
- People live in *periods* (“episodes”).  
- Gordon summarizes episodes into **share-safe artifacts** (JSON/CSV), suitable for downstream analysis/aggregation.  
- Users remain in control; nothing leaves the device unless explicitly exported.

## 2. Non-goals (v0.1)

Gordon is **not**:
- a habit tracker or wellness coach
- a supplement recommender
- a medical device
- a social/community platform
- a cloud-first product
- a causal inference engine

## 3. Product principles (guardrails)

1. **Episodes over diaries**: bounded periods, not lifelong logging.
2. **Approximate beats precise-but-wrong**: weekly recall > fake daily adherence.
3. **Context over identity**: bracketed info; avoid exact identifiers by default.
4. **User attention is scarce**: Gordon is ignorable most of the time.
5. **Artifacts, not platforms**: exports/reports are the product.
6. **Explicit uncertainty**: capture confidence and caveats.
7. **Nothing leaves device without consent**: export preview + per-field sharing controls.

## 4. High-level UX style

- Dark, friendly aesthetic: dark blue background (not black).
- Ivory/white primary text.
- Light blue/soft accent color for subtext and controls.
- Icon/splash: curious scientist beaver (cartoon), calm tone.

## 5. Core concepts

### 5.1 Baseline Context (anonymous “box”)
A small, bracketed description of the user’s baseline situation used to interpret reports.  
**All fields optional.**  
Each field has a **share default** toggle (included in exports by default: off).

Example bracketed fields:
- Sex (optional): `male | female | intersex | prefer_not_to_say | other`
- Age bracket: e.g. `48-53`
- Height bracket (cm): e.g. `179-184`
- Weight bracket (kg): e.g. `70-75`
- Relationship status: `single | long_term | married | prefer_not_to_say`
- Typical cardio minutes/week (coarse integer or bracket)
- Health notes (short, controlled-ish): e.g. “rosacea (well controlled)”
- Routine schema (coarse): habits/supplements already established

#### Routine schema: duration + regularity
For any routine item (supplement/habit), capture:
- **Duration:** `days | weeks | months | years`
- **Regularity:** `rarely | some_days | most_days | daily`
- Optional source: `supplement | food | mixed`
- Optional notes (short)

> v0.1: store routine schema as JSON to avoid schema explosion.

### 5.2 Episode
An episode is a **bounded span of days** the user wants to summarize.  
Episodes can be:
- **Observational**: “normal period, nothing special”
- **Intervention**: something intentional started/changed and is worth tracking

Default episode:
- Auto-created on first launch
- Runs to the end of the current quarter unless redefined
- User can rename/redefine/close at any time

### 5.3 Interventions (within an episode)
An intervention is something the user intentionally does that may affect outcomes.
v0.1 supports:
- NMN (primary)
- TMG (linked co-intervention)
- Additional “common” background items (coarse), optional:
  - omega-3, magnesium (basic), creatine, collagen
  - source can be “food” (e.g. omega-3 from herring), with optional estimated dose

Structured intervention metadata (v0.1):
- compound: `nmn | tmg | omega3 | magnesium | creatine | collagen | other`
- dose + unit (optional for coarse items)
- route: `oral | sublingual`
- form: `powder | capsule | liquid | food`
- timing: multi-select (e.g. `upon_waking`, `midday`, `evening`)
- with_food: `yes | no | mixed`
- brand + product (optional; for supplements only)
- notes (short)

### 5.4 Weekly Check-in (primary user touchpoint)
User interaction cadence: **weekly** (or less).  
Weekly check-in captures:
- adherence frequency (bin-based) per relevant intervention
- “anything changed?” (diet/exercise/sleep schedule/supplements/illness/travel/stress)
- notable events (short)
- confidence: `sure | mostly | guessing`

### 5.5 Day Notes (optional)
User can annotate a specific day in the calendar:
- quick note (“travel day”, “started new job”, “illness”)
- optionally mark a one-off deviation

> v0.1: avoid requiring per-day intervention logging; keep adherence weekly.

### 5.6 Report (artifact)
Episode output is a privacy-aware report, with:
- episode metadata (start/end, type, title)
- baseline context (only share-enabled fields)
- interventions summary (structured)
- passive metrics summary if available (optional in v0.1)
- weekly adherence summaries
- notable events/caveats
- schema versioning
- export preview + final JSON

v0.1 outputs:
- **Share-safe report JSON** (primary)
- Optional: “private report JSON” (superset)
- Optional later: CSV extracts

## 6. Data sources (v0.1 vs later)

### v0.1
- No wearable integrations required.
- Steps/sleep may be missing; UI should gracefully show “not connected”.

### Later iterations (planned)
- Apple Health (iOS) + Health Connect (Android) for steps/sleep/HR.
- Oura/Garmin: likely requires more work (OAuth, sync strategy).

## 7. Screen map (v0.1)

### 7.1 Splash
- Beaver icon + “Gordon”
- Subtitle: “an n-of-1 report tool”
- Short tagline: “Anonymous episode reports for science.”

### 7.2 Onboarding
1) Intro (very short)
2) Baseline Context (“anonymous box”) + share toggles
3) Episode defaults:
   - title suggestion: “Q{n} {year}”
   - duration default: end of quarter
4) “Anything special about this episode?”
   - No (observational)
   - Yes → define intervention(s) (NMN + optional TMG)
5) Reminders:
   - enable/disable
   - weekday + time
6) Launch

### 7.3 Home
- Current episode card:
  - title, date range
  - special element summary
  - status
- Next check-in time
- Buttons:
  - Weekly check-in
  - Calendar
  - Reports
  - Settings

### 7.4 Calendar
- Month grid
- Day markers for:
  - note present
  - check-in week boundary (optional)
- Tap day → Day detail sheet:
  - passive metrics placeholders
  - note editor

### 7.5 Weekly Check-in
- Shows baseline context summary + current episode intervention summary
- Prompts:
  - adherence bins (per intervention)
  - any changes?
  - notable events?
  - confidence
- Save

### 7.6 Episode Close / Report Preview
- “Close episode” action (manual or auto end-of-quarter)
- Preview:
  - what’s included/excluded
  - privacy scan checklist
  - final report summary (readable)
  - optional JSON preview
- Generate report → store in Reports

### 7.7 Reports
- List of generated reports
- Actions:
  - view
  - export
  - delete

### 7.8 Export
- Save to Files (JSON)
- Later: connectors (Open Humans / Rejuve / Alethios)

### 7.9 Settings
- Reminders schedule
- Privacy defaults
- Data management:
  - export all (private)
  - wipe all local data
- About:
  - app version
  - schema version

## 8. Database + storage (v0.1)

### Tech
- Expo SQLite (`expo-sqlite`)
- Migration system
- Store JSON blobs for flexible structures where needed

### Entities (logical)
- baseline_context (singleton)
- episodes
- interventions (per episode)
- weekly_checkins (per episode)
- day_notes (per episode/date)
- reports (generated artifacts)

### Versioning
- `db_version` in meta table
- `schema_version` embedded in report JSON

## 9. Privacy model (v0.1)

### Default posture
- No accounts
- No analytics SDKs
- No network calls required for core function
- Sharing is explicit and previewed

### De-identification strategy
- Use brackets/categories for baseline context
- Avoid exact dates in shared report when possible:
  - represent time as relative day numbers within episode (optional v0.1)
- Avoid free text in share-safe report (keep notes short; allow user to exclude notes)
- Provide “share toggles” per field and a “report scope” summary before export

### User controls
- Per-field sharing defaults
- Per-report preview and final confirmation
- Full wipe

## 10. Iteration plan (suggested)

### Iteration 1 — Skeleton + DB + onboarding
- Navigation scaffold
- Expo SQLite schema + migrations
- Onboarding screens storing baseline_context + current episode

### Iteration 2 — Weekly check-in + calendar notes
- Weekly check-in CRUD
- Calendar with day_notes CRUD

### Iteration 3 — Report generation (share-safe JSON)
- Close episode
- Generate report JSON from baseline + episode + check-ins + notes
- Reports list + export to Files

### Iteration 4 — Improvements
- Better privacy preview
- Better episode editing/redefining
- Add passive metrics table if integrating Apple Health later

## 11. Open questions (track as TODOs)

- Exact definition of “quarter” for episode default (calendar quarter vs rolling 90 days)
- Relative-day representation in reports (recommended) vs real dates (opt-in)
- How to represent “food source” estimates (optional fields + clear “estimated” flag)
- Export integrations requirements (Open Humans / Rejuve / Alethios APIs)
- Whether to add biometric lock/encryption in v0.1 or later

---
End of spec (v0.1)
