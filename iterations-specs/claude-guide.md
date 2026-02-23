### General Guidlines

## Stack 
- Frontend: Next.js 14+ App Router, TypeScript strict
- Backend: not applicable
- Styling: Tailwind only — no CSS modules, no styled-components

## Hard Rules
- Never install a new dependency without asking first
- Never modify the database schema without showing the migration plan
- Environment variables go in .env, never hardcoded

  
## Patterns
- Use server components by default, client components only when 
  interactivity is required
- Error boundaries on every route segment

## Testing
- Always leave testing after implementation to me, no need to start the app