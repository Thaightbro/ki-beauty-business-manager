# ki-beauty-business-manager
Web-based business management system for KI Beauty - appointments, customers, services and scheduling.

## Local development

This repository contains the Next.js application imported from `ki-beauty-app`.
Use Node.js 24 (also required for the TypeScript-based tests) and install dependencies:

```sh
npm ci
npm run dev
```

Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
in your local environment. Do not commit environment files or credentials.

## Checks

```sh
npx tsc --noEmit --incremental false
npm run lint
node --test --test-isolation=none tests/*.test.mjs
npm run build
```

The local tests use a Supabase mock and do not read or modify production data.
The production build downloads Geist fonts from Google Fonts and requires network access.

## Appointment validation

Creating and editing appointments load the selected service's duration on the server.
The entire appointment must fall between 08:00 and 20:00 Bangkok time; ending at
20:00 is allowed. Both paths check overlaps with booked appointments, excluding
an appointment's own ID when editing, and calculate both start and end times.

These are application-level checks. The separate overlap check and write are not
atomic. No database schema or RLS policies are changed by this import.
