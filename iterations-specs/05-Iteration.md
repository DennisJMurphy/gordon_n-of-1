# Iteration 5 — Reports + Export

## Goals
- Reports list screen
- View/export/delete reports

## Tasks

### Reports List Screen
- [ ] List all generated reports
- [ ] Show per report:
  - Episode title
  - Generated date
  - Export status (exported to X at Y, or "not exported")
- [ ] Tap to view report

### Report Detail View
- [ ] Human-readable summary
- [ ] Collapsible JSON preview
- [ ] Actions:
  - Export
  - Delete

### Export
- [ ] Export to Files (iOS Share sheet / Android share)
- [ ] Save as `.json` file
- [ ] Update `exported_to` and `exported_at` fields

### Delete Report
- [ ] Confirm dialog
- [ ] Remove from database

## Data
- Uses `reports` table
- Track export history in `exported_to`, `exported_at`

## Notes
- Export targets (Open Humans, Rejuve, Alethios) are post-v0.1
- For now, just save to local files via share sheet
