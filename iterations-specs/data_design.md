Tables (minimal set)

baseline_context

id (single row)

bracketed fields (age_bracket, height_bracket, etc.)

share_* flags per field (export inclusion)

plus your “duration/regularity” items:

store as JSON for v0.1 to avoid schema explosion (or separate table later)

episodes

id

title (e.g., “Q1 2026”, “NMN month”)

start_date, end_date

type (observational | intervention)

special_summary (short string)

status (active | closed)

interventions (only if episode has them)

id, episode_id

compound (nmn, tmg, etc.)

dose, unit

route (oral, sublingual)

form (powder, capsule, liquid, food)

timing_json (array of times like ["upon_waking","midday"])

with_food (yes/no/mixed)

brand (text optional)

notes (optional, but keep short)

weekly_checkins

id, episode_id

week_start_date

adherence_json (per compound: every day/most/some/rare/none)

changes_json (diet/exercise/sleep/supplements/illness/travel/stress)

events_json (notable events)

confidence (sure/mostly/guessing)

created_at

day_notes

id, episode_id, date

note (short)

optional per-day “took intervention?” only if you truly want it; otherwise keep adherence weekly-only

reports

id, episode_id

generated_at

report_json (the final share-safe artifact)

private_json (optional)

schema_version

exported_to (nullable, later)

exported_at (nullable)

metrics_daily (optional, can be added later)
If you connect Apple Health/Oura later, store daily aggregates:

date, steps, sleep_duration, resting_hr, hrv, etc.
This can be safely missing in v0.1 (use placeholders).