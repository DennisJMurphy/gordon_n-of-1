Answers to questions from Claude:
Navigation style: bottom tabs (home, calendar, reports, settings) is fine
ID generation: UUIDs for all entity IDs, yes.
Quarter Definition: Calendar quarters as default

Iteration 1 — Skeleton + DB + Onboarding (current)
Expo project setup (done)
SQLite schema + migrations (done)
Navigation scaffold (tab navigator or stack)
Onboarding flow screens:
    Intro/splash
    Baseline context form (bracketed fields + share toggles)
    Episode setup (title, dates, observational vs intervention)
    Intervention definition (if intervention type)
    Reminder preferences
 Store baseline_context + create first episode on completion