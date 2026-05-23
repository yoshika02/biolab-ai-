# BioLab AI

A Next.js 14 App Router project for laboratory operations, protocol management, and secure team collaboration.

## Project features

- TypeScript + Tailwind CSS with App Router.
- Prisma ORM with PostgreSQL schema for users, sessions, activity logs, and notifications.
- Authentication API for login, registration, refresh tokens, and user profile management.
- Dashboard shell with sidebar, topbar, notifications, stat cards, activity feed, and module shortcuts.
- Initial dashboard pages for Protocol, Papers, Inventory, Experiments, Primers, Safety, Analytics, and Profile.

## Getting started

1. Install dependencies:

`ash
npm install
`

2. Copy environment variables:

`ash
copy .env.example .env
`

3. Update .env with your PostgreSQL connection and JWT secrets.

4. Run Prisma migrations:

`ash
npm run db:migrate
`

5. Seed test users:

`ash
npm run db:seed
`

6. Start the development server:

`ash
npm run dev
`

Open http://localhost:3000 in your browser.

## Available scripts

- 
pm run dev — run the app locally.
- 
pm run build — build the app for production.
- 
pm run start — start the production server.
- 
pm run lint — run ESLint.
- 
pm run db:migrate — apply Prisma migrations.
- 
pm run db:seed — seed demo users.

## Environment variables

- DATABASE_URL — PostgreSQL connection string.
- JWT_ACCESS_SECRET — secret for access tokens.
- JWT_REFRESH_SECRET — secret for refresh tokens.
- ADMIN_INVITE_CODE — invite code required for admin registration.
