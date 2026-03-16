# Iteration 9 — Initial Test Suite

## Goal

Add automated tests for existing business logic and data layer. Focus on pure functions and repository CRUD — skip external library wrappers (expo-notifications, expo-sharing, expo-file-system, React component rendering).

## Framework

- **Jest** + **ts-jest** (Expo/RN standard, mature mocking)
- No React Testing Library needed at this stage

## What We Test

### Phase 1 — Setup
- Install `jest`, `ts-jest`, `@types/jest`
- Configure `jest.config.js` for path aliases
- Create `src/__mocks__/expo-sqlite.ts` — mock `db` with `getFirstAsync`, `getAllAsync`, `runAsync`
- Create `src/__mocks__/expo-crypto.ts` — mock `randomUUID` to return deterministic IDs
- Verify a trivial test runs

### Phase 1.5 — DB initialization & migrations (~8 tests)

Uses a **real in-memory SQLite** instance (`:memory:`), not mocks — these are integration tests for the migration system.

**`src/db/__tests__/migrations.test.ts`**
- `initDb()` on fresh DB — all tables created, meta version matches latest migration id
- `initDb()` called twice — idempotent, no errors, no duplicate tables/data
- Each migration's tables are queryable (`SELECT * FROM episodes` etc. doesn't error)
- Migrations run in order — meta version increments sequentially
- A bad migration (e.g. invalid SQL injected) fails loudly, does not advance version
- Schema spot-checks: key columns exist, JSON columns accept text, foreign keys present

### Phase 2 — Pure utility functions (~20 tests)

**`src/utils/dates.ts`**
- `formatDateISO` — standard dates, single-digit months/days
- `formatDateDisplay` — locale output format
- `getQuarterStartDate` — Q1–Q4 boundaries, mid-quarter dates
- `getQuarterEndDate` — Q1–Q4 boundaries
- `getQuarterLabel` — formatting "Q1 2026" etc.
- `getDefaultEpisodeTitle` — no existing episodes, multiple episodes in same quarter, cross-quarter
- `slugify` — spaces, special chars, accented chars, empty string

**`src/db/repositories/weeklyCheckins.ts`**
- `getCurrentWeekStart` — Monday calculation for various days of the week, Sunday edge case

**`src/services/notifications.ts`** (pure helpers only)
- `getDayName` — all 7 days
- `formatTime` — midnight, noon, PM hours

**`src/services/reportSharing.ts`** (pure helper only)
- `getReportFilename` — normal title, special chars, long title

### Phase 3 — Report builder pure functions (~25 tests)

**`src/services/reportBuilder.ts`**
- `getRelativeDay` — same day, future day, negative offset
- `calculateAverageAdherence` — empty array, single checkin, mixed adherence levels, missing adherence
- `aggregateChanges` — no changes, multiple changes with same category, mixed categories
- `buildShareSafeReport` — all fields shared, no fields shared, partial share_defaults, empty checkins, no interventions
- `buildPrivateReport` — verify it includes full detail vs share-safe

### Phase 4 — Repository CRUD (~40 tests)

All repositories mock `db.getFirstAsync`, `db.getAllAsync`, `db.runAsync`.

**`src/db/repositories/episodes.ts`**
- `getEpisodeById` — found, not found
- `getAllEpisodes` — empty, multiple
- `getActiveEpisode` — found active, none active
- `createEpisode` — verify INSERT params, returned entity
- `updateEpisode` — partial update with null-coalescing, not found

**`src/db/repositories/interventions.ts`**
- `getInterventionsByEpisode` — empty, multiple
- `createIntervention` — verify JSON.stringify of timing array
- `updateIntervention` — partial update, timing JSON merge
- `deleteIntervention` — success, not found (changes === 0)

**`src/db/repositories/weeklyCheckins.ts`**
- `getCheckinsByEpisode` — sorted DESC
- `getCheckinByWeek` — found, not found
- `createCheckin` — verify adherence_json, changes_json, events_json serialization
- `updateCheckin` — JSON merge with ?? fallback chain
- `deleteCheckin` — success, not found

**`src/db/repositories/baselineContext.ts`**
- `getBaselineContext` — found with JSON fields, not found
- `saveBaselineContext` — INSERT path (no existing), UPDATE path (merge with existing)

**`src/db/repositories/dayNotes.ts`**
- `getNotesByDateRange` — boundary dates
- `upsertNote` — insert path, update path
- `getDatesWithNotes` — returns Set<string> correctly

**`src/db/repositories/reports.ts`**
- `createReport` — verify report_json serialization
- `markReportExported` — sets exported_at timestamp

### Phase 5 — Service orchestrators (~15 tests)

Mock repositories (not raw DB) for these.

**`src/services/reportBuilder.ts`** (async functions)
- `generateReports` — assembles data from repos, calls pure builders, returns both report types
- `generateAndSaveReports` — calls generateReports + saves via createReport

**`src/services/dataManagement.ts`**
- `exportAllData` — verify output structure includes all tables
- `wipeAllData` — verify all DELETE calls made
- `getDataStats` — verify count queries

**`src/context/OnboardingContext.tsx`**
- `completeOnboarding` — verify baseline, episode, and intervention DB writes with correct data

## What We Skip

- `expo-notifications` (permissions, scheduling)
- `expo-sharing` / `expo-file-system` (file I/O, platform sharing)
- `expo-crypto` (thin wrapper)
- React component rendering / navigation
- Screen-level integration tests

## Test file structure

```
src/
  __mocks__/
    expo-sqlite.ts
    expo-crypto.ts
  utils/
    __tests__/
      dates.test.ts
  services/
    __tests__/
      reportBuilder.test.ts
      reportSharing.test.ts
      notifications.test.ts
      dataManagement.test.ts
  db/
    __tests__/
      migrations.test.ts
    repositories/
      __tests__/
        episodes.test.ts
        interventions.test.ts
        weeklyCheckins.test.ts
        baselineContext.test.ts
        dayNotes.test.ts
        reports.test.ts
  context/
    __tests__/
      OnboardingContext.test.ts
```
