# Truck Asset Matchmaking Platform (TAMP)

TAMP is a front-end MVP for a digital freight marketplace that connects **Freight Owners** with cargo to move and **Transporters** with available truck capacity.

This project is being developed for the Industrial Computing Engineering (Pty) Ltd TAMP MVP assessment. The application uses React, TypeScript and browser-based mock persistence to demonstrate the platform workflow without requiring a production backend.

> **Development branch:** `freight-owner`
>
> **Current status:** Authentication and account recovery are functional. The repository now also contains the TAMP domain model, South African mock dataset, browser-persisted mock database, rule-based matchmaking logic, audit events, receipt/trip creation, tracking, ratings, disputes and KPI calculations. Freight Owner routes for loads, posting, matches and tracking are present, but the role-facing UI is still being connected to the underlying mock services.

## Table of Contents

- [Project Objective](#project-objective)
- [Current MVP Status](#current-mvp-status)
- [Technology Stack](#technology-stack)
- [Implemented Features](#implemented-features)
- [Mock Data and Local Persistence](#mock-data-and-local-persistence)
- [Matchmaking Rules](#matchmaking-rules)
- [Application Routes](#application-routes)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Demo Account](#demo-account)
- [Project Structure](#project-structure)
- [Browser Storage](#browser-storage)
- [Demo Guide](#demo-guide)
- [Requirements Traceability](#requirements-traceability)
- [Testing Status](#testing-status)
- [Known Limitations](#known-limitations)
- [Next Development Priorities](#next-development-priorities)

## Project Objective

The Truck Asset Matchmaking Platform is intended to support a simplified freight journey between three platform roles:

- **Freight Owner** — posts cargo loads, reviews suitable trucks, accepts or rejects matches and monitors trips.
- **Transporter** — posts available trucks, reviews suitable loads, accepts or rejects matches and updates delivery progress.
- **Administrator** — oversees users, compliance, disputes, audit activity and platform metrics.

For this assessment, the project uses synthetic/mock data and browser storage rather than production APIs, live GPS integrations or external services.

## Current MVP Status

### Authentication foundation

The application currently supports:

- Freight Owner registration.
- Transporter registration.
- Login for locally registered users.
- Seeded Administrator login.
- Role-based protected routes.
- Remember-me session behavior.
- Forgot-password flow.
- Browser-based password reset with a temporary token.
- Password hashing for registered demo users using the Web Crypto API.

### Freight Owner branch

The `freight-owner` branch now contains dedicated routes/pages for:

- Freight Owner dashboard.
- My Loads.
- Post Load.
- Matches.
- Tracking.

The role layout also includes responsive navigation, the signed-in user's name/email, profile initial and sign-out behavior.

The Freight Owner screens are still being developed. The underlying service/data layer is ahead of some of the visible page implementations, so features should only be considered complete once their UI is wired to the mock database and demonstrated end-to-end.

### TAMP mock domain layer

The project now has a reusable local data layer that models the main MVP entities and actions:

- Users.
- Compliance-document data.
- Loads.
- Trucks.
- Matches.
- Receipts.
- Trips.
- Tracking events.
- Ratings.
- Disputes.
- Audit events.
- Platform lookup values and KPI calculations.

This layer is implemented in `src/services/mockDb.ts` and backed by the South African JSON seed dataset.

## Technology Stack

| Technology                        | Purpose                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| React 19                          | User interface and reusable components                               |
| TypeScript                        | Static typing and TAMP domain contracts                              |
| React Router DOM 7                | Client-side routing and role protection                              |
| Vite 8                            | Development server and production build                              |
| CSS                               | Responsive styling                                                   |
| Web Crypto API                    | PBKDF2/SHA-256 password hashing for browser-registered demo accounts |
| `localStorage` / `sessionStorage` | Mock persistence and authentication session state                    |
| JSON fixtures                     | Synthetic South African MVP seed data                                |
| Oxlint                            | Source linting                                                       |

This remains a **front-end-only MVP**. There is no production backend API or database connected to the application.

## Implemented Features

### Authentication

- Freight Owner and Transporter account registration.
- Form and email validation.
- Duplicate registered-email protection.
- Password validation.
- Salted PBKDF2/SHA-256 password hashing using the browser Web Crypto API.
- Login for registered Freight Owners and Transporters.
- Seeded Admin demonstration login.
- Remember-me behavior using browser storage.
- Role-based redirects after login.
- Protected role routes.
- Forgot-password and password-reset flow.
- Password-reset token expiry after 15 minutes.
- New salt and password hash generated after reset.
- Newly registered Freight Owner and Transporter profiles are synchronized into the TAMP mock database.

### Role layout

`RoleLayout.tsx` provides the shared authenticated application shell:

- Responsive sidebar/navigation.
- Mobile navigation overlay.
- Role-specific navigation.
- Signed-in user's name.
- Signed-in user's email.
- User initial/avatar placeholder.
- Sign-out action.
- Nested route rendering through React Router.

### Domain types

`src/types/tamp.ts` defines the main TAMP contracts and statuses, including:

- `User`
- `Load`
- `Truck`
- `Match`
- `Receipt`
- `Trip`
- `TrackingEvent`
- `Rating`
- `Dispute`
- `AuditEvent`
- Lookup/location types
- South African province types
- Load, truck, match and trip status types

### Mock database service

`src/services/mockDb.ts` provides the browser-side MVP data operations.

Implemented service capabilities include:

- Initialize/reset the mock database from JSON seed data.
- Persist the mock database to `localStorage`.
- Add registered users to the TAMP domain database.
- Read users by ID or role.
- Create and list loads.
- Update load status.
- Create and list trucks.
- Update truck status.
- Generate and rank load/truck matches.
- Accept or reject a recommended match.
- Create an acceptance receipt.
- Create a trip when a match is accepted.
- Store and advance mock tracking events.
- Complete trips and update related load/truck/match state.
- Submit post-trip ratings.
- Recalculate a user's average rating.
- Create and resolve disputes.
- Write audit events for important platform actions.
- Calculate Freight Owner, Transporter and Admin KPIs.

## Mock Data and Local Persistence

The project uses a synthetic South African dataset loaded from:

```text
src/data/tamp-mock-data-za.json
```

The data contracts are defined in:

```text
src/types/tamp.ts
```

The browser persistence layer is implemented in:

```text
src/services/mockDb.ts
```

The mock database is stored locally and automatically re-seeded when the fixture version changes.

This approach gives the front-end a backend-like data source while remaining within the assessment requirement to use mock/sample data.

## Matchmaking Rules

The current local matchmaking service uses transparent rules rather than AI.

A truck must satisfy the following hard requirements to be considered eligible:

1. **Capacity** — truck weight and volume capacity must cover the load.
2. **Vehicle compatibility** — the truck type must match the load's required vehicle type.
3. **Availability** — truck availability must overlap the load pickup window.

Location is currently used as a ranking preference:

- same pickup city adds to the match score;
- a different current city does not automatically reject an otherwise compatible truck.

### Current score

| Rule                         |   Score |
| ---------------------------- | ------: |
| Capacity passes              |      30 |
| Vehicle compatibility passes |      35 |
| Availability overlaps        |      25 |
| Same-city location           |      10 |
| **Maximum**                  | **100** |

Each generated match stores readable rule-check reasons so the UI can explain why the match was recommended or rejected.

## Application Routes

| Route                      | Access        | Purpose                                 |
| -------------------------- | ------------- | --------------------------------------- |
| `/`                        | Public        | Redirects to login                      |
| `/login`                   | Public        | Sign in                                 |
| `/register`                | Public        | Register a Freight Owner or Transporter |
| `/forgot-password`         | Public        | Start password recovery                 |
| `/reset-password`          | Recovery flow | Reset a locally registered password     |
| `/freight-owner`           | Freight Owner | Freight Owner dashboard                 |
| `/freight-owner/loads`     | Freight Owner | Freight Owner loads                     |
| `/freight-owner/loads/new` | Freight Owner | Post a new load                         |
| `/freight-owner/matches`   | Freight Owner | Freight Owner match area                |
| `/freight-owner/tracking`  | Freight Owner | Freight Owner tracking area             |
| `/transporter`             | Transporter   | Transporter dashboard                   |
| `/admin`                   | Admin         | Administrator dashboard                 |
| `*`                        | Public        | Not-found page                          |

## Getting Started

### Prerequisites

Install:

- Node.js
- npm
- A modern browser

### Clone the Freight Owner branch

```bash
git clone --branch freight-owner https://github.com/LTshepoJr/Truck-Asset-Matchmaking-Platform.git
cd Truck-Asset-Matchmaking-Platform
```

If the repository is already cloned:

```bash
git fetch
git switch freight-owner
git pull
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite.

### Production build check

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Available Scripts

| Command           | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `npm run dev`     | Starts the Vite development server                            |
| `npm run build`   | Runs the TypeScript build and creates a Vite production build |
| `npm run lint`    | Runs Oxlint                                                   |
| `npm run preview` | Serves the production build locally                           |

There is currently no automated `test` script configured in `package.json`.

## Demo Account

### Administrator

> Demonstration credentials only.

```text
Email:    tshepojr@kortestalkstech.co.za
Password: Password123!
Role:     Admin
```

Freight Owner and Transporter accounts are created from the registration page and persisted in the browser.

## Project Structure

The repository currently contains the following major front-end areas:

```text
Truck-Asset-Matchmaking-Platform/
├── public/
├── src/
│   ├── assets/
│   ├── data/
│   │   └── tamp-mock-data-za.json
│   ├── layouts/
│   │   └── RoleLayout.tsx
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminDashboardPage.tsx
│   │   ├── auth/
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── freight-owner/
│   │   │   ├── CreateLoadPage.tsx
│   │   │   ├── FreightOwnerDashboardPage.tsx
│   │   │   ├── FreightOwnerLoadsPage.tsx
│   │   │   ├── FreightOwnerMatchesPage.tsx
│   │   │   └── FreightOwnerTrackingPage.tsx
│   │   ├── transporter/
│   │   │   └── TransporterDashboardPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   ├── paths.ts
│   │   └── ProtectedRoute.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   └── mockDb.ts
│   ├── styles/
│   ├── types/
│   │   └── tamp.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── package.json
├── package-lock.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Browser Storage

The current MVP uses browser storage for both identity/session data and mock platform data.

| Key                   | Storage                            | Purpose                                                                 |
| --------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `tamp-users`          | `localStorage`                     | Locally registered Freight Owner and Transporter accounts               |
| `tamp-session`        | `sessionStorage` or `localStorage` | Current authenticated session                                           |
| `tamp-password-reset` | `sessionStorage`                   | Temporary password-reset request                                        |
| `tamp_db`             | `localStorage`                     | TAMP domain/mock database                                               |
| `tamp_db_version`     | `localStorage`                     | Seed fixture version used to determine when the mock DB must be rebuilt |

### Session behavior

- Selecting **Remember me** stores the session in `localStorage`.
- Otherwise, the session is kept in `sessionStorage`.
- `ProtectedRoute` checks the active session before rendering protected role pages.
- Cross-role navigation redirects the user to the dashboard associated with their own role.

### Mock DB behavior

On first use, `mockDb.ts` clones the JSON fixture into browser storage.

If the seed data version changes, the stored mock database is replaced with a fresh copy of the new seed. This is useful while the schema and fixture data are evolving during MVP development.

## Demo Guide

### 1. Register and sign in as a Freight Owner

1. Open `/register`.
2. Select **Freight Owner**.
3. Complete the organization and account fields.
4. Create a valid password.
5. Accept the required terms.
6. Submit the form.
7. Sign in using the account you created.
8. Confirm that TAMP redirects to `/freight-owner`.

The account is stored in `tamp-users` and the corresponding TAMP user profile is also created in the local mock database.

### 2. Explore the Freight Owner workspace

After login, use the Freight Owner navigation to access:

- Dashboard
- My Loads
- Post Load
- Matches
- Tracking

These routes are protected and only available to authenticated Freight Owner sessions.

> The visible Freight Owner feature screens are still under development. The service layer already supports the related load, matching, receipt, trip and tracking operations, but those operations should not be considered complete from a user-flow perspective until each page is connected and tested.

### 3. Password recovery

1. Return to `/login`.
2. Select **Forgot password?**
3. Enter the email address of a locally registered Freight Owner or Transporter.
4. Continue to the reset page.
5. Enter a valid new password.
6. Submit the reset.
7. Sign in with the new password.

The reset token exists only in the current browser session and expires after 15 minutes.

### 4. Admin login

Use the seeded Administrator credentials and confirm that the account is redirected to `/admin`.

## Requirements Traceability

The table below describes the state visible in the current `freight-owner` branch. A requirement is marked **Partial** where the underlying mock service exists but the complete role-facing UI has not yet been demonstrated.

| Requirement | Assessment requirement                                                 | Status      | Current evidence                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01       | Role-based registration/login for Freight Owner, Transporter and Admin | **Partial** | Freight Owner and Transporter registration/login, seeded Admin login, protected routes and role redirects are implemented. Admin self-registration is not provided.                                              |
| FR-02       | Identity/compliance information and simulated document metadata        | **Partial** | Registration captures organization/profile information and creates a pending TAMP user profile. The data model contains compliance information, but complete user-facing compliance management is not yet wired. |
| FR-03       | Freight Owner can create and view cargo loads                          | **Partial** | Freight Owner load routes/pages exist and `mockDb.ts` supports `createLoad`, load queries and status updates. The current Post Load UI still needs full integration with the service layer.                      |
| FR-04       | Transporter can create and view available trucks                       | **Partial** | `mockDb.ts` supports truck creation, lookup and status updates. Transporter posting UI is not yet implemented.                                                                                                   |
| FR-05       | Rule-based matching uses compatibility, location and availability      | **Partial** | Transparent matching rules, scoring, eligibility checks and match generation are implemented in `mockDb.ts`. Complete match UI integration remains in progress.                                                  |
| FR-06       | Users can accept or reject a match and decision is logged              | **Partial** | Service functions support accept/reject decisions and create audit events. End-to-end role UI is not yet complete.                                                                                               |
| FR-07       | Accepted match produces a digital confirmation receipt                 | **Partial** | Accepting a match creates a contract/receipt and a trip in the mock database. A complete receipt screen is not yet implemented.                                                                                  |
| FR-08       | Trip tracking uses mock coordinates or status progression              | **Partial** | Tracking events and trip progression are supported in `mockDb.ts`, and a Freight Owner tracking route exists. Full tracking UI integration is still in progress.                                                 |
| FR-09       | Parties can rate/review one another after completion                   | **Partial** | Rating creation, validation and average-rating recalculation exist in the service layer. Rating UI is not yet implemented.                                                                                       |
| FR-10       | Admin can manage users, compliance and flagged/disputed items          | **Partial** | User/dispute data operations and dispute resolution logic exist, but the Admin management UI is not complete.                                                                                                    |
| FR-11       | Admin can view basic platform metrics                                  | **Partial** | Admin KPI calculations are implemented in the mock service. The Admin KPI dashboard is not yet connected.                                                                                                        |
| FR-12       | Key actions are available in an audit trail                            | **Partial** | Audit events are generated for registration/profile creation, loads, trucks, matching, acceptance/rejection, tracking, ratings and disputes. Audit-trail UI is not yet implemented.                              |

## Testing Status

The project currently has no automated test suite configured.

Before committing or demonstrating changes, run:

```bash
npm run lint
npm run build
```

Current manual checks should include:

- Freight Owner registration.
- Transporter registration.
- Duplicate email rejection.
- Password validation.
- Successful and failed login.
- Remember-me behavior.
- Protected routes.
- Cross-role route protection.
- Password recovery.
- Password reset expiry/error handling.
- Freight Owner navigation.
- Browser persistence after reload.
- Mock database reset after a fixture version change.
- Match rule behavior at the service layer.
- Responsive behavior on desktop and mobile-sized screens.

## Known Limitations

This is still an in-progress front-end assessment MVP.

- No production backend API is connected.
- No production database is connected.
- Authentication and role sessions are browser-based.
- The seeded Admin demonstration password is stored in front-end source code.
- Password recovery does not send a real email or OTP.
- User and platform state is local to the current browser/profile.
- The mock database is not appropriate for multi-user or production use.
- Freight Owner feature routes exist, but not every page is fully connected to the service layer yet.
- Transporter truck-posting UI is not yet implemented.
- Complete match recommendation/decision UI is not yet implemented.
- A dedicated digital receipt screen is not yet implemented.
- Tracking UI is still incomplete.
- Ratings/reviews UI is not yet implemented.
- Admin compliance/dispute/KPI/audit screens are not yet complete.
- There is no automated test framework/test suite configured.

The mock service deliberately contains more of the domain workflow than the current visible UI. This lets the remaining role screens use a common, typed data layer instead of introducing separate hard-coded page data.

## Next Development Priorities

1. Connect the Freight Owner Post Load form to `createLoad`.
2. Render the signed-in owner's saved loads from the local mock DB.
3. Connect Freight Owner match recommendations to the matching service.
4. Implement Accept/Reject actions and display the resulting receipt.
5. Connect the Freight Owner tracking page to trip/tracking data.
6. Complete the Freight Owner dashboard using the implemented KPI helpers.
7. Build Transporter truck posting and load-match workflows.
8. Build ratings/reviews after trip completion.
9. Build Admin compliance, dispute, KPI and audit-trail screens.
10. Add automated tests for critical happy paths, validation and role permissions.

---

**TAMP — Truck Asset Matchmaking Platform**  
Front-end MVP for the Industrial Computing Engineering (Pty) Ltd technical assessment.
