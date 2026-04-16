# Project: [Orchard Tool]
Orchard management app for tracking individual trees by row and location, logging watering, fertilization, production, and notes to support smarter orchard decisions.

---

## Stack
- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Backend/API**: Next.js API Routes (built-in)
- **Database**: Supabase (PostgreSQL — free tier)
- **Auth**: Supabase Auth (included)
- **Deployment**: Vercel (free tier)

---

## Commands
```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run test       # Run tests
npm run lint       # ESLint check
npm run db:migrate # Run DB migrations (if applicable)
```

---

## File Structure
```
/src
  /app          # Pages and layouts (App Router) or /pages (Pages Router)
  /components   # Reusable UI components
  /lib          # Utilities, helpers, shared logic
  /hooks        # Custom React hooks
  /types        # TypeScript types and interfaces
/prisma         # DB schema and migrations (if using Prisma)
/public         # Static assets
```

---

## Code Style
- TypeScript strict mode — no `any` types
- Named exports only, no default exports (except pages/layouts)
- Tailwind utility classes only — no custom CSS files unless necessary
- Component files: PascalCase (`UserCard.tsx`)
- Utility files: camelCase (`formatDate.ts`)
- Prefer `async/await` over `.then()` chains

---

## Architecture Rules
- Keep components small and focused — one concern per file
- Fetch data at the page/layout level, pass down via props
- Put reusable logic in `/lib` or custom hooks, not inline in components
- API routes go in `/app/api/` — validate inputs, never trust client data
- Never expose secrets or API keys to the client

---

## What NOT to Do
- NEVER commit `.env` files or secrets
- Don't use `console.log` for debugging — use the project logger if one exists
- Don't install new dependencies without asking first
- Don't modify migration files that have already been applied

---

## Testing
- Write tests for utility functions in `/lib`
- Component tests use [e.g. Vitest + Testing Library / Jest + RTL]
- Run `npm run test` after any non-trivial change to verify nothing broke

---

## Notes
<!-- Add project-specific gotchas here as you discover them. Examples: -->
<!-- - Images are stored in Cloudinary, not locally -->
<!-- - The /api/webhooks route must validate signatures before processing -->
<!-- - See @docs/auth-flow.md for the full authentication sequence -->