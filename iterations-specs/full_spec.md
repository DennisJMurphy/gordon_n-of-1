# Gordon — Overall Spec (v0.2)

**Working name:** Gordon  
**Subtitle:** an n-of-1 report tool  
**Repo name:** `gordon_n-of-1`

## 1. Purpose

Gordon helps people understand how their health and wellbeing change over time, with minimal effort and maximum control over their personal data. Their observations may also contribute to research, voluntarily and with appropriate privacy protections.

The immediate product must be useful to its owner even if no research report is ever exported.

## 2. Non-goals (v0.1)

Gordon is not a medical device, diagnostic tool, supplement recommender, wellness coach, social network, cloud-first service, or causal-inference engine. It must not claim an intervention caused an observed change simply because the two coincide.

## 3. Product principles (guardrails)

1. **Continuous History, not episodes**: reporting intervals can be selected later.
2. **Context Matters**: Preserve baseline and subsequent changes, including when a fact applied.
3. **Low Friction**: Logging, check-ins, and reminders are optional: no streaks or compulsory engagement.
4. **Honest Uncertainty**: Distinguish observations, suspicions, confirmed diagnoses, estimates and unknowns where relevant.
5. **Local by default**: No account or network connection is needed for core use. Nothing is shared automatically.
6. **User benefit first**: Trends, histories, and comparisons should be useful independently of research exports.
7. **Research is a possibility, not a promise**: preserve interpretable data and provenance: test actual research usefulness with researchers rather than asserting it

## 4. UX Direction

Retain the dark-blue, ivory and soft-blue visual language and the beaver identity. Replace the **current episode** as the home-screen organizing unit with a simple overview of current concerns, ongoing interventions/routines and recent observations. Offer quick recording and access to history, optional check-ins, reports and settings.

The calendar remains a navigational view of the timeline. A detail view can show a concern's progression and changes over time. Onboarding should not auto-create a quarterly episode; baseline/context entry remains optional and can be expanded later.

## 5. Core concepts

### 5.1 Baseline and evolving context
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
- **StartDate** should support approximate dates, such as month or year
- **Duration:** `days | weeks | months | years`; derive it from known dates where possible, and allow an estimate when dates are approximate or unknown
- **Regularity:** `rarely | some_days | most_days | daily`
- Optional source: `supplement | food | mixed`
- Optional notes (short)

Baseline is the starting historical description of the person's circumstances, not an immutable profile. Existing optional bracketed demographic and routine fields remain a starting point. Health issues/concerns and established routines can be recorded as context where appropriate. Changes should preserve history rather than silently overwrite past values.

For context changes, distinguish **effective time** (when it was true) from **recorded time** (when Gordon learned about it) when feasible. Unknown dates and approximate dates must be supported without inventing precision.

Baseline health concerns are not a substitute for tracking their development. An ongoing concern may also have a linked history of observations and changes.

### 5.2 Concerns, conditions and developing events
A user can record a concern or event as it arises, observe its progression, revise its interpretation and mark its resolution. Example: scratchy throat → worsening symptoms → suspected or confirmed flu → recovery. The initial observation remains historically intact; later knowledge does not retroactively become earlier certainty.

Not all concerns have an end date. Some are recurring or ongoing. Users can record an onset approximately or retrospectively.

### 5.3 Interventions and routines
An intervention is something started, stopped or changed, such as a supplement, medication, exercise practice or other behavior. A routine can be ongoing. Capture relevant details (e.g., dose, unit, frequency, source, notes) only when useful and available. Changes should be timestamped; do not require daily adherence entries.

An ongoing intervention or activity can be recorded once with a start date and relevant details. Treat it as continuing until the user records a change or end date. Do not require periodic reconfirmation or daily adherence logging; the user only needs to update it when something changes.

**No mandatory expected outcome or hypothesis.** The user may record what they are doing without stating what it is meant to affect. No substance receives privileged product treatment.

Structured intervention metadata:
- compound: `nmn | tmg | omega3 | magnesium | creatine | collagen | other`
- dose + unit (optional for coarse items)
- route: `oral | sublingual`
- form: `powder | capsule | liquid | food`
- timing: multi-select (e.g. `upon_waking`, `midday`, `evening`)
- with_food: `yes | no | mixed`
- brand + product (optional; for supplements only)
- notes (short)

### 5.4 Observations and measurements

Support both point observations (e.g., weight on a date, sleep quality) and changing states (e.g., symptom severity over several days). Preserve units, dates, estimates and provenance when relevant. Missing entries mean **not recorded**, not necessarily **did not happen**.

### 5.5 Optional check-ins, notes and reminders

Weekly check-ins remain an available pattern, not the default requirement for all users. Check-ins and reminders may be associated with a developing concern or ongoing intervention; users control cadence and may stop at any time. Day notes remain optional and freeform.

### 5.6 Reports and export

Generate reports for a user-selected period or topic without creating or closing an episode. Include relevant context as it stood at the time, observations, interventions, changes, missingness and caveats. Keep report schema versioning and privacy preview; support private export and selectively shareable export. Never promise that an export is anonymous or scientifically validated merely because identifiers are removed.

example fields:
- report metadata (start/end, type, title)
- baseline context (only share-enabled fields)
- interventions summary (structured)
- passive metrics summary if available
- weekly adherence summaries
- notable events/caveats
- schema versioning
- export preview + final JSON

outputs:
- Selectively shareable report JSON (primary)
- Private report JSON (includes additional information excluded from shared reports)
- CSV extracts (optional, future enhancement)

## 6. Data and Storage

### 6.1 Architecture

Continue using **Expo / React Native** with **local SQLite** storage.

Design data around:

- Baseline context and its history
- Health concerns and events
- Interventions and ongoing routines
- Observations and measurements
- Optional check-ins and day notes
- Reports and exports

**These are conceptual categories, not prescribed database tables.**

### 6.2 Database Evolution

Before modifying the database, inspect the existing schema and migration history.

- Obsolete structures may be removed when no user data needs preserving.
- Document any required database resets.
- Verify that the application works correctly after a fresh installation.
- Once users rely on stored records, provide safe migration paths or explicit export/reset options.

### 6.3 Versioning and Historical Integrity

- Maintain database schema versioning independently of report schema versioning.
- Preserve historical context when baseline information changes.
- Support retrospective entries and approximate dates where appropriate.
- Determine what edit history is necessary for trustworthy comparisons and exports.
- Record the source of measurements where available (manual entry, imported data, etc.).

### 6.4 Current Data Sources

- Manual entry of observations, symptoms, interventions, and measurements.
- No wearable or external health-platform integrations required.
- Missing passive metrics must not prevent normal application use.
- The interface should gracefully indicate when a data source is not connected.

### 6.5 Future Data Sources (Planned)

- **Apple Health (iOS)** and **Health Connect (Android):** steps, sleep, heart rate, HRV, and other available metrics.
- **Oura / Garmin:** additional wearable data, potentially requiring authentication and synchronization.
- Other compatible data sources may be considered in future iterations.

## 7. Screen map

### 7.1 Splash
- Beaver icon + “Gordon”
- Subtitle: “hands-off personal tracking and an n-of-1 report tool”
- Short tagline: “personal tracking and reports for me and science.”

### 7.2 Onboarding
- Brief introduction to personal tracking and local-first privacy
- Optional baseline context (“anonymous box”) and per-field sharing preferences
- Optional reminder preferences (enable/disable, day and time)
- Ability to begin using Gordon without completing optional fields

### 7.3 Home

- Overview of ongoing concerns, routines/interventions and recent observations
- Quick action to record a concern, observation or change
- Access to concern details and history, calendar, optional check-ins, reports and settings
- Upcoming reminder or check-in information only when configured

### 7.4 Calendar
- Month grid
- Day markers for:
  - note present
  - check-in week boundary (optional)
- Tap day → Day detail sheet:
  - passive metrics placeholders
  - note editor

### 7.5 Weekly Check-in
- Shows baseline context summary + current intervention summary (if present)
- Prompts:
  - adherence bins (per intervention)
  - any changes?
  - notable events?
  - confidence
- Save

### 7.6 Report Preview
- “Generate Report” action (manual; optional opt-in automatic end-of-quarter generation)
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

## 8. Database + storage

### Tech
- Expo SQLite (`expo-sqlite`)
- Migration system
- Store JSON blobs for flexible structures where needed

### Entities (logical)
- baseline_context (singleton)
- interventions (start/end)
- weekly_checkins (optional)
- day_notes (per date)
- reports (generated artifacts)

### Versioning
- `db_version` in meta table
- `schema_version` embedded in report JSON

## 9. Privacy model

### Default posture
- No accounts
- No analytics SDKs
- No network calls required for core function
- Sharing is explicit and previewed

**Local storage is not a guarantee of confidentiality.** Gordon stores data on this device and does not upload it as part of normal use. The app does not currently encrypt its database or require an app lock. Data may be accessible to someone with access to the device, through malicious software, or through device backups depending on the user's settings. Exported or shared copies are outside Gordon's control. Users should avoid entering information they would not want stored on this device.

### De-identification strategy
- Use brackets/categories for baseline context
- Avoid exact dates in shared report when possible:
- Avoid free text in share-safe report (keep notes short; allow user to exclude notes)
- Provide “share toggles” per field and a “report scope” summary before export

### User controls
- Per-field sharing defaults
- Per-report preview and final confirmation
- Full wipe

## 10. Open questions (track as TODOs)

- Relative-day representation in reports (recommended) vs real dates (opt-in)
- How to represent “food source” estimates (optional fields + clear “estimated” flag)
- Export integrations requirements (Open Humans / Rejuve / Alethios APIs)
- Whether to add biometric lock/encryption

