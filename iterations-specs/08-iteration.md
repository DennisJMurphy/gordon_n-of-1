# Iteration 8 — about screen for settings, and baseline-profile editability

About text:
<about>
Gordon is a privacy-first tool for turning personal habits and self-experiments into structured, anonymized reports.

Instead of tracking everything all the time, Gordon summarizes meaningful periods of your life — “episodes” — and produces simple reports you can choose to share. The goal is to help you to contribute useful data to health and longevity research while keeping your personal information under control.
</about>


- the "About Gordon" text should appear in the ABOUT block, above "App version"
    - a button should open a popup with the about text, conforming to the style of "Default sharing preferences" 
- the app should also allow, from the settings screen, a person to change or update their baseline profile
    - a button 'Change/Update Baseline Profile' should appear beneath 'Export all data", and direct to the profile edit screen.
- the 'wipe all local data" button should be at the bottom of the screen


Settings screen section reorder:

REMINDERS
  Weekly check-in reminder        [toggle]

PRIVACY DEFAULTS
  Default sharing preferences     Edit →

CONTEXT BASELINE                  ← new section
  Edit baseline data              Edit →   ← navigates to new EditBaselineScreen

DATA
  [stats row]
  Export all data                 →

ABOUT
  About Gordon                   Info →   ← new, opens modal with about text
  App version                    0.x.x    (static, not a button)
  Schema version                 0.x.x    (static, not a button)
  Wipe all local data            ← moved here from DATA section (red/destructive)

[logo footer]

Implementation:

1. About Gordon modal — new tappable row in ABOUT section, above App version. Opens a bottom-sheet modal (same style as "Default sharing preferences") displaying the about text.

2. Edit baseline data — new CONTEXT BASELINE section between Privacy Defaults and Data. Tapping navigates to a new EditBaselineScreen.tsx in main. This screen has the same form fields as onboarding's BaselineContextScreen but reads/writes via getBaselineContext()/saveBaselineContext() directly (not useOnboarding()). Save button → write to DB → navigate back.

3. Move "Wipe all local data" from DATA section to bottom of ABOUT section.

4. Navigation — add EditBaseline to HomeStackParamList and HomeStackNavigator.
