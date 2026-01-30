# Iteration 2 — Home + Weekly Check-in

## Goals
- Home screen with current episode card
- Weekly check-in form and CRUD

## Tasks

### Home Screen
- [ ] Current episode card showing:
  - Title
  - Date range (start → end)
  - Type badge (observational/intervention)
  - Status badge (active/closed)
  - Special summary (if intervention)
- [ ] Next check-in indicator
- [ ] Quick action buttons:
  - Weekly check-in
  - (Calendar and Reports handled by tabs)

### Weekly Check-in Form
- [ ] Show current episode context at top
- [ ] Adherence bins per intervention:
  - `every_day | most_days | some_days | rarely | not_at_all`
- [ ] Changes flags (multi-select):
  - diet, exercise, sleep, supplements, illness, travel, stress
- [ ] Notable events (short text list, add/remove)
- [ ] Confidence selector: `sure | mostly | guessing`
- [ ] Save check-in

### Check-in History
- [ ] List past check-ins for current episode
- [ ] Tap to view/edit
- [ ] Delete check-in

## Data
- Uses `weekly_checkins` table
- `adherence_json`: `{ [compound]: "every_day" | "most_days" | ... }`
- `changes_json`: `{ diet: bool, exercise: bool, ... }`
- `events_json`: `["event1", "event2"]`

## Notes
- Check-in should be quick (<60 seconds per spec)
- Only show adherence for interventions defined in current episode
