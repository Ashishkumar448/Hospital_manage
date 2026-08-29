# AI Agent Instructions: Frontend & UI Architecture

Welcome, future AI Agent! If you have been tasked with modifying the UI of this Hospital Management System, please read this architectural guide carefully before making changes.

This project is a **Turborepo monorepo** utilizing Next.js (App Router) and Tailwind CSS. The codebase is strictly modularized to separate shared UI elements from app-specific business logic.

## 1. Where to find UI Components

### `packages/ui` (Shared Components & Global Pages)
Any component, page, or layout that is shared across **multiple applications** lives in the `@repo/ui` package (located in `packages/ui/src/`).
- **Landing Page**: If you need to edit the main hospital landing page, you will find it at `packages/ui/src/pages/LandingPage/LandingPage.tsx`.
- **Authentication**: Login screens and protected route wrappers are located in `packages/ui/src/components/Auth/`.
- **Chatbot**: The floating AI assistant widget is located at `packages/ui/src/Chatbot.tsx`.

> **Rule:** If you are building a generic button, card, or a layout component that will be used by multiple hospital portals, create it in `packages/ui/src/` and export it in `packages/ui/package.json`.

### `apps/*` (App-Specific Pages & Dashboards)
Each hospital portal is an independent Next.js application located in the `apps/` directory. They contain the specific dashboards and routing logic for each user role.
- **Patient Dashboard**: `apps/user/app/dashboard/page.tsx`
- **Nursing/Staff Dashboard**: `apps/otherst/app/dashboard/page.tsx`
- **Doctor Dashboard**: `apps/doctor/app/dashboard/page.tsx`
- **Admin Dashboard**: `apps/admin/app/dashboard/page.tsx`
- **Executives Dashboard**: `apps/executives/app/dashboard/page.tsx`

> **Rule:** If you are tasked with modifying the "Patient Dashboard" or adding a new tab for "Doctors", you must make those changes directly in the respective `apps/<role>/app/dashboard/page.tsx` file.

## 2. Styling (Tailwind CSS)
Tailwind CSS is configured globally. 
- Shared components in `packages/ui` use standard Tailwind utility classes.
- Each app in `apps/*` imports its global CSS which includes Tailwind directives.

## 3. Database & Backend
- All Firebase initialization (Auth, Firestore, etc.) is centralized in `packages/firebase`.
- Do not initialize Firebase directly inside the apps; always import `db` and `auth` from `@repo/firebase`.

**Summary for AI Agents:**
Check `packages/ui` first for shared views (like the Landing Page). Check `apps/` for role-specific dashboard views.
