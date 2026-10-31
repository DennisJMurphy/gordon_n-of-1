# Gordon — Iteration 11: Continuous Concern History

**Status:** Ready for implementation after repository inspection. Product decisions confirmed 2026-10-31. No existing user data needs preserving.

## Objective

Introduce the first **episode-independent, continuous-history** user journey: create a health concern, add dated updates, and mark it resolved, while keeping its history intact.

## Why this slice

The scratchy-throat → flu → recovery journey tests the new product's core idea without immediately redesigning supplements, baseline versioning, reports and every existing screen.

## Scope

1. Inspect the **actual repository**: SQLite schema/migrations, navigation, screens, reports, tests, and every reference to episodes/`episode_id`. Write a short impact map before making changes. Treat `data_design.md` as a historical design, not authoritative implementation evidence.
2. Define the smallest durable representation for a concern and dated updates, including approximate onset, observation date, optional note, evolving label/interpretation and optional resolution. Preserve distinctions between suspected and confirmed labels where used.
3. Add a simple way to create a concern, record an update and resolve/reopen it if needed.
4. Show a concern's chronological history and observed duration where onset and resolution are known.
5. **Remove the old episode model**, including obsolete tables, episode-centric navigation/onboarding, and dead references. No data migration or legacy compatibility layer is required. Adapt reusable non-episode functionality where feasible; where a feature (such as old episode reports) cannot yet work correctly, explicitly defer/disable it without leaving broken routes. Document whether a local database reset or reinstall is needed.
6. Add tests for chronology, backdated updates, unknown/approximate dates, resolution and reopening, and SQLite persistence.

## Out of scope

- A general-purpose causal inference system.
- Required expected outcomes for interventions.
- Full intervention/routine redesign.
- Full baseline history/versioning implementation (design separately, but ensure this slice does not preclude it).
- Research export schema redesign or health-platform integration.
- Legacy episode data migration: confirmed unnecessary because no user data needs protecting.
- Filling the missing Iteration 9 `notifications.test.ts` and `OnboardingContext.test.ts` test coverage; track as a separate checking task.
- Remaining `npm audit` vulnerability review; track separately and avoid indiscriminate `npm audit fix --force`.

## Acceptance criteria

- A user can record a concern without creating an episode; the app no longer creates or asks for episodes.
- A user can add a later or backdated update without rewriting the original observation.
- A user can revise an interpretation (e.g., scratchy throat to suspected flu) while preserving earlier context.
- A user can mark resolution and see an elapsed duration when enough date information exists; otherwise Gordon does not fabricate a duration.
- Data persists across app restarts, including after a fresh install and a documented reset of the development database.
- No check-in, reminder, hypothesis or intervention is required to complete the journey.
- No episode model remains in active runtime code or the current database schema (including tables, foreign keys, home cards, onboarding prompts and navigation routes). Historical documentation and migration history are excluded. Old report paths must be updated or explicitly unavailable.
- Relevant automated tests are added/updated; the full existing test suite passes, and the revised flow works on a physical device or simulator.
- Expo Doctor and lint/typecheck (where configured) pass; report what was actually run.

## Implementation guidance and remaining UI choices

- Start by inspecting the current code and migration numbering. Do not assume the historical `data_design.md` reflects the database.
- **Confirmed:** development data may be wiped; old episode tables should be removed, not preserved. Prefer a clean schema/reset strategy appropriate to the actual repository and document it.
- **Default UI:** add a clear **Concerns** entry point on Home and a concern detail/history screen; reuse the existing calendar if convenient, but do not make it a prerequisite.
- **Working terminology:** use **Concern** in the data model and initial UI. A concern can represent a symptom, issue or developing illness; names and interpretations may change.
- Preserve observation history when the label changes; record both event/effective date and creation timestamp where possible. Support date-only and approximate/unknown onset without inventing a precise date.
- Keep the implementation narrow: do not build general causality analysis, baseline versioning or a complete new report engine in this iteration.

## Copilot handoff

1. Read `full_spec.md`, this iteration, `10-revision.md`, `data_design.md`, and inspect the real codebase.
2. Present a brief impact map and proposed schema/navigation changes **before implementing**; flag any contradictions.
3. Implement the concern journey and clean episode removal, with tests. No legacy-data preservation.
4. Run available tests, typecheck/lint and Expo Doctor where configured. Report commands, results, remaining gaps and any reset steps.
5. Do **not** work on the missing Iteration 9 tests or dependency-audit cleanup as part of this task.

## Example acceptance journey

Oct 1: record scratchy throat (unknown cause). Oct 3: add fever and fatigue; mark flu as suspected. Oct 4: optionally record a positive test. Oct 9: mark recovered. Review history: original Oct 1 note remains unchanged, later interpretation is visible, and duration is shown without implying certainty about causation or diagnosis.
