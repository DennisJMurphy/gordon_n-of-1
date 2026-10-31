# Gordon — Copilot Instructions

## What This Is
Privacy-first React Native (Expo SDK 57) app for continuous personal health tracking. Users record **concerns** and dated updates, ongoing interventions/routines, notes and optional check-ins. Data stays on-device in SQLite. Reports are temporarily unavailable while the report model is redesigned for continuous history.

## Hard Rules
- **Never install a new dependency without asking first.**
- **Never modify the database schema without showing the migration plan.**
- Environment variables go in `.env`, never hardcoded.
- Testing is done manually by the developer — don't try to start or run the app.

## Architecture Overview

```
App.tsx → initDb() → RootNavigator
    ├── OnboardingNavigator  (first-run flow, writes baseline + optional interventions)
  └── MainTabNavigator
      ├── Home (HomeStackNavigator — concerns, check-ins, interventions)
        ├── Calendar
        ├── Reports
        └── Settings
```

- **No global state store.** Screens use local `useState` + `useFocusEffect` to reload data on focus.
- **OnboardingContext** is the only React context — transient state for the onboarding wizard, not used after completion.
- **Screens call repository functions directly** — there is no service/controller layer for reads.

## Database (`src/db/`)

- **expo-sqlite** with raw parameterized SQL (no ORM). Three methods: `db.getFirstAsync<Row>()`, `db.getAllAsync<Row>()`, `db.runAsync()`.
- **Migrations** in `src/db/migrations.ts` — sequential `Migration[]` array with incremental `id`. Each runs in a transaction; version tracked in a `meta` table. Add new migrations by appending to the array.
- **JSON-in-SQLite** pattern: complex fields stored as `TEXT` columns with `_json` suffix (e.g. `routine_json`, `adherence_json`). Read with `JSON.parse(row.xxx_json) ?? default`, write with `JSON.stringify()`.

### Repository Pattern (`src/db/repositories/`)

Each table has a repository file exporting async CRUD functions:

Concern updates are append-only timeline entries. Preserve the initial observation; later observations, interpretation changes, and status changes are separate records.

- IDs generated via `generateId()` → `Crypto.randomUUID()` from `src/utils/uuid.ts`
- Timestamps via `getISOTimestamp()` → `new Date().toISOString()` from `src/utils/dates.ts`
- `create` functions INSERT then re-read with `getById` to return the complete entity
- `update` functions fetch existing row first, merge with `??` fallback, then UPDATE

## Screen Conventions (`src/screens/`)

- Wrap content in `<ScreenContainer>` (or `<ScreenContainer scrollable>`).
- Named exports only: `export function XxxScreen()`.
- Props typed as `NativeStackScreenProps<ParamList, 'ScreenName'>`.
- Loading/saving guard: `const [loading, setLoading] = useState(true)`.
- Errors: `try/catch` → `console.error` + `Alert.alert('Error', message)`.

## UI Components (`src/components/ui/`)

- Atoms: `Button` (variants: primary/secondary/ghost), `TextInput`, `Select`, `Toggle`, `ScreenContainer`.
- Re-exported from `src/components/ui/index.ts`.
- Styles via `StyleSheet.create` in same file, using theme tokens from `src/theme/index.ts` (`colors`, `spacing`, `fontSize`, `borderRadius`).
- Dark theme only — backgrounds are dark blues (`#0f1729`), not black.

## Services (`src/services/`)

- **`dataManagement.ts`** — `exportAllData()`, `shareExportedData()`, `wipeAllData()`, `getDataStats()` for baseline, concerns, interventions, check-ins, notes and their timeline events.
- **`notifications.ts`** — Weekly reminders via expo-notifications, settings persisted in AsyncStorage.

## Key Conventions

| Concern | Pattern |
|---|---|
| Date-only fields | `YYYY-MM-DD` strings, parse with `+'T00:00:00'` to avoid TZ shift |
| Metadata timestamps | Full ISO-8601 (`new Date().toISOString()`) |
| Display dates | `formatDateDisplay()` → `"Jan 30, 2026"` |
| Null bridging | DB: `null` ↔ Domain: `undefined` via `?? undefined` (read) / `?? null` (write) |
| Navigation types | Typed param lists in `src/navigation/types.ts`, composite nav for cross-boundary |
| Exports | Named exports everywhere, no `default` exports |
| Iteration specs | Design docs and iteration plans live in `iterations-specs/` |
