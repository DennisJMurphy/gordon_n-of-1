# Iteration 3 — Calendar + Day Notes

## Goals
- Calendar month view
- Day notes CRUD

## Tasks

### Calendar Screen
- [ ] Month grid view
- [ ] Navigation (prev/next month)
- [ ] Day markers:
  - Dot if note exists for that day
  - Optional: week boundary indicators
- [ ] Tap day → open day detail sheet

### Day Detail Sheet
- [ ] Show date
- [ ] Passive metrics placeholders (empty for v0.1)
- [ ] Note editor (text input)
- [ ] Save / delete note

### Day Notes CRUD
- [ ] Create note for a day
- [ ] Update existing note
- [ ] Delete note
- [ ] Unique constraint: one note per (episode_id, date)

## Data
- Uses `day_notes` table
- Notes should be short (per spec: quick annotations)

## Notes
- Calendar should only show days within current episode date range (or highlight them)
- Keep notes brief — this is for "travel day", "started new job", "illness", not journaling
