# Gordon Agent Guidelines

## Stack

- React Native with Expo SDK 57 and React Navigation.
- TypeScript strict mode.
- On-device SQLite through `expo-sqlite`; data stays local unless the user explicitly exports or shares it.

## Hard Rules

- Never install a new dependency without asking first.
- Never modify the database schema without showing the migration plan first and receiving approval.
- Put environment variables in `.env`; never hardcode them.
- Do not start or launch the Expo app, and do not perform manual UI testing. Automated tests and TypeScript type checking are permitted.

## Product and Architecture

Gordon is a privacy-first app for continuous personal health tracking. Users record concerns and dated updates, ongoing interventions or routines, day notes, and optional weekly check-ins. Reports are temporarily unavailable while the report model is redesigned for continuous history.

The application starts in `App.tsx`, initializes the database, and renders `RootNavigator`:

- `OnboardingNavigator` is the first-run flow and writes baseline data plus optional interventions.
- `MainTabNavigator` contains Home, Calendar, Reports, and Settings as sibling tabs.
- The Home tab contains `HomeStackNavigator` for concerns, interventions, check-ins, and baseline editing.

Architectural constraints:

- Do not introduce a global state store. Screens use local `useState`; data-list and detail screens normally reload on focus with `useFocusEffect` where appropriate.
- `OnboardingContext` is the only React context. Keep it transient and limited to the onboarding wizard.
- Screens call repository functions directly for reads; there is no service/controller layer for repository reads.
- Services coordinate cross-cutting operations such as data export, wiping, statistics, and notifications rather than acting as a general read layer.

## Database

- Use `expo-sqlite` with raw, parameterized SQL. No ORM.
- Use the asynchronous database API, including `getFirstAsync<Row>()`, `getAllAsync<Row>()`, `runAsync()`, and `execAsync()` for multi-statement SQL and transaction or pragma commands.
- Migrations live in `src/db/migrations.ts` as a sequential `Migration[]` with incremental IDs. Append migrations in order. Each migration runs in a transaction, and `meta.db_version` records the current version.
- Store complex values in `TEXT` columns whose names end in `_json`, such as `routine_json` and `adherence_json`.
- Timeline events and their parent records share the owning repository. For example, concern updates are handled by the concerns repository, and intervention events by the interventions repository.

### Repository Conventions

- Concern updates are append-only timeline entries. Preserve the initial observation; later observations, interpretation changes, and status changes remain separate records.
- Generate IDs with `generateId()` and full ISO-8601 metadata timestamps with `getISOTimestamp()`.
- Bridge database nulls to domain `undefined` with `?? undefined` when reading, and domain `undefined` to `null` with `?? null` when writing.
- `create` functions normally insert and then read by ID to return the complete entity.
- `update` functions normally fetch the existing row, merge optional values with `??`, and update the row.
- Preserve the existing JSON-in-SQLite read/write patterns unless a change is specifically required.

## Screens and UI

- Put screens under `src/screens/` and normally wrap screen content in `ScreenContainer` or `ScreenContainer scrollable`.
- Export screen components as named exports using the `XxxScreen` pattern.
- Type stack-screen props with the relevant navigation param list. Use the navigation helpers in `src/navigation/types.ts` for cross-boundary navigation.
- Use `loading` and `saving` guards for asynchronous screens and mutations where needed. Static screens do not need loading state solely to follow this convention.
- Handle errors for the operation's user impact. Log useful diagnostics and provide appropriate user-facing feedback when necessary; do not add an alert for every recoverable or non-actionable error.
- Put UI atoms in `src/components/ui/` and re-export them from `src/components/ui/index.ts`.
- Define component styles in the same file with `StyleSheet.create` and the tokens in `src/theme/index.ts`: `colors`, `spacing`, `fontSize`, and `borderRadius`.
- Keep the dark theme consistent: dark blue backgrounds such as `#0f1729`, not black.
- Framework entry points such as `App.tsx` and `app.config.ts` may use default exports. Application modules otherwise follow the existing named-export convention.

## Dates and Display

- Use `YYYY-MM-DD` for date-only fields and parse date-only strings with `T00:00:00` when constructing a local date to avoid timezone shifts.
- Use full ISO-8601 strings for metadata timestamps.
- Use `formatDateDisplay()` for user-facing dates.

## Testing and Validation

- Automated Jest tests and TypeScript type checking are permitted.
- Prefer focused automated validation for the changed surface, then broader checks when warranted.
- Do not launch or run the Expo app and do not perform manual UI testing.
- Leave manual testing to the developer.

## Documentation

- Put design documents and iteration plans in `iterations-specs/`.
- Keep these instructions aligned with the implementation when architectural behavior changes.