# Gordon — Copilot Instructions

## What This Is
Privacy-first React Native (Expo SDK 54) app for structured n-of-1 self-experiment reports. Users create time-bounded **episodes**, log **interventions** and **weekly check-ins**, then generate anonymized reports. All data stays on-device in SQLite.

## Hard Rules
- **Never install a new dependency without asking first.**
- **Never modify the database schema without showing the migration plan.**
- Environment variables go in `.env`, never hardcoded.
- Testing is done manually by the developer — don't try to start or run the app.

## Architecture Overview

```
App.tsx → initDb() → RootNavigator
  ├── OnboardingNavigator  (first-run flow, writes baseline + first episode)
  └── MainTabNavigator
        ├── Home (HomeStackNavigator — episodes, checkins, interventions)
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

```typescript
// Private row interface matching SQLite columns (all strings/nulls)
interface EpisodeRow { ... }

// Pure mapper: DB nulls → domain undefined, JSON parse
function rowToEpisode(row: EpisodeRow): Episode { ... }

// Standard exports:
export async function getEpisodeById(id: string): Promise<Episode | null>
export async function getAllEpisodes(): Promise<Episode[]>
export async function createEpisode(data: Omit<Episode, 'id' | 'created_at' | 'updated_at'>): Promise<Episode>
export async function updateEpisode(id: string, data: Partial<...>): Promise<Episode | null>
```

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

- **`reportBuilder.ts`** — Two-tier reports: `ShareSafeReport` (anonymized, relative dates, no brands) and `PrivateReport` (full detail). Pure builder functions + async orchestrator. Schema version `0.1.0`.
- **`dataManagement.ts`** — `exportAllData()`, `shareExportedData()`, `wipeAllData()`, `getDataStats()`.
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
