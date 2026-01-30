# Iteration 4 — Episode Close + Report Generation

## Goals
- Close episode action
- Generate share-safe report JSON
- Privacy preview before generation

## Tasks

### Close Episode Flow
- [ ] "Close episode" button (on home or episode detail)
- [ ] Confirm dialog
- [ ] Set episode status to `closed`
- [ ] Trigger report generation

### Report Builder
- [ ] Aggregate data from:
  - `baseline_context` (only share-enabled fields)
  - `episodes` (metadata)
  - `interventions` (structured summary)
  - `weekly_checkins` (adherence summaries)
  - `day_notes` (if user opts to include)
- [ ] Schema versioning in report

### Privacy Preview
- [ ] Show what will be included/excluded
- [ ] Per-field toggles (inherit from share_defaults, allow override)
- [ ] Privacy scan checklist:
  - No exact dates (use relative day numbers)
  - No identifying free text
  - Bracketed values only
- [ ] Preview final JSON (optional, collapsible)

### Generate Report
- [ ] Create share-safe `report_json`
- [ ] Optionally create `private_json` (superset)
- [ ] Store in `reports` table
- [ ] Show success confirmation

## Data
- Uses `reports` table
- `schema_version`: e.g., "0.1.0"
- `generated_at`: ISO timestamp

## Notes
- Reports are artifacts — the core output of Gordon
- User should feel confident about what they're sharing
