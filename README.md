# Truck Asset Matchmaking Platform (TAMP)

TAMP is a responsive front-end MVP for a digital freight marketplace that connects **Freight Owners** with cargo to move and **Transporters** with available truck capacity.

The project was developed for the Industrial Computing Engineering (Pty) Ltd TAMP MVP assessment. It uses React, TypeScript, synthetic South African data and browser storage to demonstrate the freight workflow without requiring a production backend.

> **Branch:** `main`  
> **Last README review:** 5 August 2026  
> **Current status:** The Freight Owner workflow is implemented end to end. Transporter and Administrator operational screens are the next development priorities.

## Table of Contents

- [Project Objective](#project-objective)
- [MVP Status](#mvp-status)
- [Freight Owner Workflow](#freight-owner-workflow)
- [Technology Stack](#technology-stack)
- [Architecture and Data Flow](#architecture-and-data-flow)
- [Implemented Features](#implemented-features)
- [Matchmaking Rules](#matchmaking-rules)
- [Application Routes](#application-routes)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Demo Accounts and Seed Data](#demo-accounts-and-seed-data)
- [Demo Guide](#demo-guide)
- [Browser Storage](#browser-storage)
- [Project Structure](#project-structure)
- [Requirements Traceability](#requirements-traceability)
- [Testing Status](#testing-status)
- [Known Limitations](#known-limitations)
- [Development Roadmap](#development-roadmap)

## Project Objective

TAMP demonstrates a simplified and transparent freight journey between three platform roles:

- **Freight Owner** — posts cargo loads, reviews suitable trucks, accepts or rejects matches, monitors delivery progress and rates the Transporter.
- **Transporter** — posts available trucks, reviews suitable loads, accepts or rejects matches, updates trip progress and rates the Freight Owner.
- **Administrator** — manages users and compliance, reviews platform activity, handles disputes and monitors platform metrics.

The current implementation focuses on the complete Freight Owner journey while retaining shared, typed domain services for the future Transporter and Administrator interfaces.

## MVP Status

| Area              | Status                 | Current implementation                                                                                                        |
| ----------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Authentication    | Functional             | Freight Owner and Transporter registration, seeded Administrator login, protected routes, account recovery and role redirects |
| Freight Owner     | Implemented end to end | Loads, matching, decisions, receipt, tracking, ratings and settings                                                           |
| Transporter       | Foundation only        | Registration and dashboard route exist; operational screens remain pending                                                    |
| Administrator     | Foundation only        | Seeded login and dashboard route exist; management and analytics screens remain pending                                       |
| Persistence       | Functional for the MVP | JSON seed data with `localStorage` and `sessionStorage`                                                                       |
| Automated testing | Not configured         | Lint and production build scripts are available                                                                               |

### Assessment scope covered

The current Freight Owner implementation demonstrates:

- role-based authentication;
- profile and identity management;
- load posting and management;
- deterministic truck recommendations;
- match acceptance and rejection;
- audit events;
- digital confirmation receipts;
- simulated trip tracking;
- post-trip ratings;
- responsive role-based navigation.

The remaining work is mainly the reciprocal Transporter workflow and the Administrator console.

## Freight Owner Workflow

```text
Register
  → Sign in
  → Update profile/settings
  → Post a load
  → View saved loads
  → Generate truck recommendations
  → Accept or reject a match
  → View the digital receipt
  → Track the trip
  → Complete the trip
  → Rate the Transporter
```

Implemented Freight Owner screens:

- Dashboard
- My Loads
- Post Load
- Matches
- Digital Receipt
- Tracking
- Ratings and Reviews
- Settings

## Technology Stack

| Technology                        | Purpose                                         |
| --------------------------------- | ----------------------------------------------- |
| React 19                          | User interface and reusable components          |
| TypeScript 7                      | Static typing and TAMP domain contracts         |
| React Router DOM 7                | Client-side routing and protected role areas    |
| Vite 8                            | Development server and production build tooling |
| CSS                               | Responsive page and component styling           |
| Web Crypto API                    | PBKDF2/SHA-256 password hashing                 |
| `localStorage` / `sessionStorage` | Browser-side persistence and session handling   |
| JSON fixtures                     | Synthetic South African MVP data                |
| Oxlint                            | Source linting                                  |

This is a **front-end-only MVP**. No production backend API or database is connected.

## Architecture and Data Flow

```text
React pages and components
        │
        ├── authService.ts
        │     ├── registration
        │     ├── login and session handling
        │     ├── password recovery
        │     └── account/profile synchronization
        │
        └── mockDb.ts
              ├── users and compliance
              ├── loads and trucks
              ├── rule-based matching
              ├── decisions and receipts
              ├── trips and tracking events
              ├── ratings and disputes
              ├── audit events
              └── KPI calculations
                        │
                        └── browser storage
```

Main data contracts:

```text
src/types/tamp.ts
```

Synthetic South African seed data:

```text
src/data/tamp-mock-data-za.json
```

Browser-side domain operations:

```text
src/services/mockDb.ts
```

## Implemented Features

### Authentication and account recovery

- Freight Owner and Transporter registration.
- Organization, full name, email and phone capture.
- Form validation and duplicate-email protection.
- Password validation and show/hide controls.
- Salted PBKDF2/SHA-256 password hashing.
- Login for browser-registered users.
- Seeded Administrator demonstration login.
- Remember-me session behavior.
- Protected role routes.
- Cross-role redirect protection.
- Forgot-password and password-reset flow.
- Temporary reset token with a 15-minute expiry.
- New password salt and hash generation after reset.
- Synchronization between authentication records and the TAMP mock database.

### Shared role layout

`RoleLayout.tsx` provides:

- responsive sidebar navigation;
- a mobile navigation overlay;
- role-specific navigation;
- the signed-in user's name and organization;
- profile-picture or initial fallback;
- live profile refresh after Settings changes;
- sign-out behavior;
- nested route rendering.

### Freight Owner dashboard

The dashboard reads the signed-in Freight Owner's browser data and displays:

- total loads;
- open loads;
- active deliveries;
- pending reviews;
- quick actions;
- recent loads;
- current trip progress;
- recent load, match, trip and rating activity;
- clear empty states for new accounts.

### Load posting and management

Freight Owners can:

- create a load;
- select South African origin and destination locations;
- select a cargo type;
- enter a cargo description;
- enter weight and volume;
- select a required vehicle type;
- define a pickup window;
- validate the form before submission;
- view the saved result;
- filter and review their own loads;
- open the matching workflow for a selected load.

### Rule-based matching

The matching interface:

- generates recommendations for an open load;
- evaluates available seeded trucks;
- shows eligible and rejected results;
- displays a transparent score out of 100;
- shows readable reasons for every rule;
- restricts decisions to the correct Freight Owner;
- blocks acceptance of an ineligible or unavailable match.

### Match decisions and auditability

A Freight Owner can:

- accept an eligible recommendation;
- reject a recommendation;
- confirm the decision in a modal;
- view the saved decision state.

Accepting a match:

- marks the load as matched;
- reserves the selected truck;
- expires conflicting recommendations;
- creates a digital receipt;
- creates a trip;
- records audit events.

Rejecting a match records the decision and creates an audit event.

### Digital confirmation receipt

An accepted match produces a printable receipt containing:

- contract ID;
- match ID;
- decision;
- accepting user;
- timestamp;
- route;
- load details;
- truck details;
- Transporter details;
- mock IP address and user-agent evidence;
- trip ID and status.

Receipt access is restricted to the Freight Owner who owns the related load.

### Simulated trip tracking

Tracking includes:

- Freight Owner-specific trip selection;
- receipt-to-tracking navigation through `tripId`;
- progress percentage;
- route illustration;
- simulated coordinates;
- current location label;
- tracking-event timeline;
- truck and Transporter details;
- a completed-trip call to action for ratings.

The six-stage demo progression is:

```text
Confirmed
  → At pickup
  → Loaded
  → In transit
  → At delivery
  → Completed
```

Tracking updates validate status order, coordinates and location labels before changing state.

### Ratings and reviews

After a trip is completed, a Freight Owner can:

- select the completed trip;
- rate the Transporter from 1 to 5;
- add a comment which is required;
- submit one review per trip;
- view the submitted review;
- view review history.

The service verifies that the reviewed user is the other party in the completed trip and recalculates the user's average rating.

### Settings and profile picture

The Freight Owner Settings page supports:

- editing the full name;
- editing the organization name;
- changing the sign-in email;
- editing the phone number;
- adding a profile picture;
- replacing a profile picture;
- removing a profile picture;
- opening the password-reset flow.

Profile images:

- accept JPG, PNG and WEBP;
- are limited to a 5 MB original upload;
- are centre-cropped;
- are compressed to a 512 × 512 JPEG;
- are validated before storage;
- appear immediately in the shared role layout.

Profile changes synchronize:

- `tamp-users`;
- `tamp_db`;
- the active `tamp-session`.

Newly registered users begin with pending verification and compliance statuses. These values are read-only for Freight Owners and are intended for a future Administrator review workflow.

### Mock domain services

`src/services/mockDb.ts` includes:

- mock database initialization and reset;
- version-based fixture refresh;
- user and profile operations;
- compliance metadata;
- load operations;
- truck operations;
- transparent match evaluation and generation;
- match decisions;
- receipt creation;
- trip creation;
- tracking progression;
- rating submission;
- dispute creation and resolution;
- audit events;
- Freight Owner, Transporter and Administrator KPI calculations.

## Matchmaking Rules

TAMP uses transparent deterministic rules rather than artificial intelligence.

### Eligibility

A truck must pass all three hard requirements:

1. **Capacity** — truck weight and volume capacity must cover the load.
2. **Vehicle compatibility** — truck type must match the required vehicle type.
3. **Availability** — truck availability must overlap the load pickup window.

Location is a ranking preference. A truck in the same pickup city receives additional points, but a different city does not automatically reject an otherwise eligible truck.

### Score

| Rule                  |   Score |
| --------------------- | ------: |
| Capacity passes       |      30 |
| Vehicle type matches  |      35 |
| Availability overlaps |      25 |
| Same pickup city      |      10 |
| **Maximum**           | **100** |

Every generated result stores readable pass/fail reasons so that the recommendation can be explained.

## Application Routes

| Route                              | Access        | Purpose                                 |
| ---------------------------------- | ------------- | --------------------------------------- |
| `/`                                | Public        | Redirects to login                      |
| `/login`                           | Public        | Sign in                                 |
| `/register`                        | Public        | Register a Freight Owner or Transporter |
| `/forgot-password`                 | Public        | Start password recovery                 |
| `/reset-password`                  | Recovery flow | Reset a locally registered password     |
| `/freight-owner`                   | Freight Owner | Dashboard                               |
| `/freight-owner/loads`             | Freight Owner | View owned loads                        |
| `/freight-owner/loads/new`         | Freight Owner | Post a load                             |
| `/freight-owner/matches`           | Freight Owner | Generate and review recommendations     |
| `/freight-owner/receipts/:matchId` | Freight Owner | View an accepted-match receipt          |
| `/freight-owner/tracking`          | Freight Owner | Track accepted deliveries               |
| `/freight-owner/ratings`           | Freight Owner | Rate Transporters after completion      |
| `/freight-owner/settings`          | Freight Owner | Edit profile and profile picture        |
| `/transporter`                     | Transporter   | Dashboard placeholder                   |
| `/admin`                           | Administrator | Dashboard placeholder                   |
| `*`                                | Public        | Not-found page                          |

## Getting Started

### Prerequisites

Install:

- Node.js 20.19+ or 22.12+
- npm
- a modern browser

### Clone the repository

```bash
git clone https://github.com/LTshepoJr/Truck-Asset-Matchmaking-Platform.git
cd Truck-Asset-Matchmaking-Platform
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

### Verify the project

```bash
npm run lint
npm run build
```

## Available Scripts

| Command           | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Starts the Vite development server                        |
| `npm run build`   | Runs the TypeScript build and creates a production bundle |
| `npm run lint`    | Runs Oxlint                                               |
| `npm run preview` | Serves the production build locally                       |

There is currently no automated `test` script in `package.json`.

## Demo Accounts and Seed Data

### Administrator demonstration account

> Demonstration credentials only. Do not reuse this password for a real account.

```text
Email:    tshepojr@kortestalkstech.co.za
Password: Password123!
Role:     Admin
```

### Freight Owner and Transporter accounts

Freight Owner and Transporter credentials are created through `/register`.

The users inside `tamp-mock-data-za.json` are domain seed records, not authentication accounts. Their plain-text passwords do not exist in the JSON file.

Browser-registered passwords are not stored in plain text. The application stores a password hash and random salt in `tamp-users`.

### South African seed data

The seed fixture contains fictional:

- people and companies;
- email addresses;
- compliance records;
- loads and trucks;
- matches and receipts;
- trips and tracking events;
- ratings and disputes;
- audit events.

Real South African place names and selected city-centre coordinates are used to make the demonstration realistic.

The current fixture version is `1.0.0`.

## Demo Guide

### 1. Register and sign in

1. Open `/register`.
2. Select **Freight Owner**.
3. Complete the organization and account fields.
4. Create a valid password.
5. Accept the required terms.
6. Submit the registration form.
7. Sign in using the new account.
8. Confirm that the application opens `/freight-owner`.

### 2. Update Settings

1. Open **Settings**.
2. Change the name, organization, email or phone.
3. Add an optional profile picture.
4. Save the changes.
5. Confirm that the shared layout updates immediately.

### 3. Post a load

1. Open **Post Load**.
2. Select the origin and destination.
3. Select the cargo type.
4. Enter weight, volume and a description.
5. Select the required vehicle type.
6. Enter the pickup start and end.
7. Create the load.

### 4. Generate recommendations

1. Open **My Loads**.
2. Find the newly created open load.
3. Select **Find Matches**.
4. Generate recommendations.
5. Review eligible and rejected trucks.
6. Expand the rule explanations.

### 5. Accept or reject

1. Reject one recommendation to demonstrate the logged decision.
2. Accept an eligible recommendation.
3. Confirm that the selected truck becomes reserved.
4. Confirm that conflicting recommendations expire.

### 6. View the receipt

1. Open the accepted match's digital receipt.
2. Review the contract, load, truck and confirmation evidence.
3. Print the receipt or continue to Tracking.

### 7. Track and complete the trip

Advance the demo status in this order:

```text
Confirmed
  → At pickup
  → Loaded
  → In transit
  → At delivery
  → Completed
```

Confirm that the progress bar, route position, timeline and related statuses update after every step.

### 8. Rate the Transporter

1. Select **Rate Transporter** after completion.
2. Choose 1–5 stars.
3. Add a comment.
4. Submit the review.
5. Confirm that the review appears in history and cannot be submitted twice.

### Optional 100/100 match scenario

With a fresh `tamp_db`, the seed fixture contains an available Cape Town Tautliner (`TRK-002`).

Post this load:

| Field            | Value               |
| ---------------- | ------------------- |
| Origin           | Cape Town           |
| Destination      | Johannesburg        |
| Cargo type       | Packaged food       |
| Weight           | 12,000 kg           |
| Volume           | 50 m³               |
| Required vehicle | Tautliner           |
| Pickup from      | 30 July 2026, 08:00 |
| Pickup until     | 30 July 2026, 15:00 |

When `TRK-002` is still available, the truck passes capacity, vehicle compatibility, availability and same-city location for a score of `100/100`.

> The fixture uses fixed July 2026 demo dates. Reset the mock database before repeating the scenario.

## Browser Storage

| Key                   | Storage                            | Purpose                                                         |
| --------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `tamp-users`          | `localStorage`                     | Registered Freight Owner and Transporter authentication records |
| `tamp-session`        | `sessionStorage` or `localStorage` | Current authenticated session                                   |
| `tamp-password-reset` | `sessionStorage`                   | Temporary password-reset request                                |
| `tamp_db`             | `localStorage`                     | TAMP mock domain database                                       |
| `tamp_db_version`     | `localStorage`                     | Fixture version used for automatic reseeding                    |

### Session behavior

- Selecting **Remember me** stores the session in `localStorage`.
- Otherwise, the session is stored in `sessionStorage`.
- `ProtectedRoute` checks the session before rendering protected routes.
- A user who opens the wrong role area is redirected to the correct dashboard.

### Reset only the mock domain data

To reset `tamp_db` without deleting registered authentication accounts, run this in the browser console:

```js
localStorage.removeItem("tamp_db");
localStorage.removeItem("tamp_db_version");
location.reload();
```

The next mock database read recreates it from the JSON fixture.

### Clear all local MVP data

Clear the TAMP storage keys through browser developer tools when a completely clean demonstration is required.

This also removes locally registered Freight Owner and Transporter accounts.

## Project Structure

```text
Truck-Asset-Matchmaking-Platform/
├── documentation/
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
│   │   │   ├── FreightOwnerRatingsPage.tsx
│   │   │   ├── FreightOwnerReceiptPage.tsx
│   │   │   ├── FreightOwnerSettingsPage.tsx
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

## Requirements Traceability

The following table reflects the current `main` branch.

| Requirement | MVP requirement                                                           | Status       | Current evidence                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-01       | Role-based registration/login for Freight Owner, Transporter and Admin    | **Partial**  | Freight Owner and Transporter registration/login, seeded Admin login, protected routes and role redirects are implemented. Admin self-registration is not provided.            |
| FR-02       | Identity/compliance information and simulated document upload or metadata | **Partial**  | Registration and Settings manage identity/profile data. Compliance statuses and document metadata exist, but the complete upload and Administrator review workflow is pending. |
| FR-03       | Freight Owner can create and view cargo loads                             | **Complete** | Post Load form, saved result, owned-load list, filtering and dashboard summaries are implemented.                                                                              |
| FR-04       | Transporter can create and view available trucks                          | **Partial**  | Truck creation/query services and seed data exist. Transporter truck-management screens are pending.                                                                           |
| FR-05       | Rule-based matching uses compatibility, location and availability         | **Complete** | Transparent evaluation, scoring, rule explanations and Freight Owner recommendation screens are implemented.                                                                   |
| FR-06       | Users can accept or reject a match and the decision is logged             | **Partial**  | Freight Owner Accept/Reject and audit logging are implemented. Reciprocal Transporter decisions are pending.                                                                   |
| FR-07       | Accepted match produces a digital confirmation receipt                    | **Complete** | Acceptance creates an ownership-protected printable receipt and trip.                                                                                                          |
| FR-08       | Trip tracking uses mock coordinates or status progression                 | **Complete** | Route illustration, coordinates, progress stages, event timeline and sequential demo updates are implemented.                                                                  |
| FR-09       | Parties can rate/review one another after completion                      | **Partial**  | Freight Owner-to-Transporter ratings are implemented. Reciprocal Transporter ratings are pending.                                                                              |
| FR-10       | Admin manages users, compliance and flagged/disputed items                | **Partial**  | User, compliance and dispute services/data exist. Administrator management screens are pending.                                                                                |
| FR-11       | Admin views basic platform metrics                                        | **Partial**  | Administrator KPI calculations exist. The analytics interface is pending.                                                                                                      |
| FR-12       | Key actions are available in an audit trail                               | **Partial**  | Load, match, trip, rating, profile and dispute actions write audit events. A dedicated Administrator audit viewer is pending.                                                  |

## Testing Status

Run the current verification commands before committing or demonstrating changes:

```bash
npm run lint
npm run build
```

There is no automated test framework or `npm test` script configured yet.

Manual checks should cover:

- Freight Owner registration;
- duplicate-email rejection;
- valid and invalid login;
- remember-me behavior;
- protected-route and cross-role redirects;
- forgot-password and reset flow;
- Settings updates and profile-picture add/remove;
- load validation and creation;
- load ownership filtering;
- match generation and rule explanations;
- rejection of ineligible matches;
- match acceptance and rejection;
- receipt ownership protection;
- sequential tracking updates;
- invalid tracking status and coordinate handling;
- trip-completion state synchronization;
- rating eligibility and duplicate protection;
- responsive desktop and mobile layouts.

## Known Limitations

- No production backend API or database is connected.
- Authentication and authorization are simulated in the browser.
- Registered accounts exist only in the browser profile that created them.
- The seeded Administrator password is present in front-end source code.
- Password recovery does not send a real email, OTP or SMS.
- Profile pictures are stored as compressed data URLs in browser storage.
- Verification and compliance approval are not controlled through an Administrator interface yet.
- Transporter operational screens are not implemented yet.
- Administrator management, analytics and audit screens are not implemented yet.
- Seeded operational dates are fixed demonstration dates.
- Tracking uses simulated coordinates and status progression rather than live GPS.
- Receipt IP address and user-agent values are mock evidence.
- Payment, invoicing, escrow and production e-signature are outside the MVP scope.
- No automated test framework is configured.
- Browser storage is not suitable for production-scale security, concurrency or persistence.

## Development Roadmap

1. Build the Transporter dashboard.
2. Add truck posting and truck-management screens.
3. Add Transporter-side load recommendations and match decisions.
4. Add Transporter trip-status controls and Freight Owner ratings.
5. Build the Administrator user and compliance console.
6. Add dispute and audit views.
7. Add Administrator KPI and analytics screens.
8. Add automated tests for critical validation, permissions and state transitions.
9. Replace browser storage with a backend API and persistent database for production use.

---

**TAMP — Truck Asset Matchmaking Platform**  
Front-end MVP for the Industrial Computing Engineering (Pty) Ltd technical assessment.
