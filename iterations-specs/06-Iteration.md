# Iteration 6 — Settings + Polish

## Goals
- Settings screen
- Data management
- UX polish and edge cases

## Tasks

### Settings Screen
- [ ] Reminders:
  - Enable/disable
  - Day of week
  - Time of day
- [ ] Privacy defaults:
  - Edit baseline share toggles
- [ ] Data management:
  - Export all data (private backup)
  - Wipe all local data (with confirmation)
- [ ] About:
  - App version
  - Schema version

### Reminder System
- [ ] Schedule local notifications (expo-notifications)
- [ ] Weekly reminder for check-in
- [ ] Respect user preferences

### Data Management
- [ ] Full export: dump all tables to JSON
- [ ] Full wipe: drop all data, reset to fresh state
- [ ] Both require confirmation dialogs

### Polish
- [ ] Loading states
- [ ] Error handling and user-friendly messages
- [ ] Empty states (no episodes, no check-ins, etc.)
- [ ] Keyboard handling on forms
- [ ] Accessibility basics

### Edge Cases
- [ ] Episode with no check-ins
- [ ] Episode with no interventions (observational)
- [ ] Multiple closed episodes
- [ ] Re-opening an episode (or not — decide policy)

## Notes
- Keep settings minimal — Gordon should be ignorable
- Wipe is irreversible — make it very clear
