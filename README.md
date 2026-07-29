# Truck Asset Matchmaking Platform (TAMP)

TAMP is a front-end MVP for a digital freight marketplace that connects **Freight Owners** with cargo to move and **Transporters** with available truck capacity.

This repository is being developed for the Industrial Computing Engineering (Pty) Ltd TAMP MVP assessment. The current implementation focuses on the authentication foundation, role-based routing, browser-side persistence, password recovery, and initial role dashboard scaffolding.

> **Current status:** Authentication and account-recovery flows are functional in the browser. The main freight workflow (load/truck posting, matchmaking, acceptance, tracking, ratings, and admin management/analytics) is still to be implemented.

## Table of Contents

- [Current MVP Status](#current-mvp-status)
- [Technology Stack](#technology-stack)
- [Implemented Features](#implemented-features)
- [Application Routes](#application-routes)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Demo Accounts and Test Data](#demo-accounts-and-test-data)
- [Project Structure](#project-structure)
- [Authentication and Browser Storage](#authentication-and-browser-storage)
- [Demo Guide](#demo-guide)
- [Requirements Traceability](#requirements-traceability)
- [Testing Status](#testing-status)
- [Known Limitations](#known-limitations)
- [Planned Next Steps](#planned-next-steps)

## Current MVP Status

The project currently provides the authentication and routing foundation for the three TAMP user roles:

- **Freight Owner** — can register, sign in, recover/reset a password, and access the Freight Owner dashboard.
- **Transporter** — can register, sign in, recover/reset a password, and access the Transporter dashboard.
- **Administrator** — can sign in using the seeded demonstration account and access the Admin dashboard.

The three dashboards currently contain introductory placeholder content. The operational TAMP modules have not yet been connected to them.

## Technology Stack

| Technology                        | Purpose                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| React 19                          | User-interface components                                      |
| TypeScript                        | Static typing                                                  |
| React Router DOM 7                | Client-side routing and protected role routes                  |
| Vite 8                            | Development server and production build tooling                |
| CSS                               | Responsive page styling                                        |
| Web Crypto API                    | Browser-side PBKDF2 password hashing for registered demo users |
| `localStorage` / `sessionStorage` | Browser-side MVP persistence and session management            |
| Oxlint                            | Source linting                                                 |

This is currently a **front-end-only MVP**. There is no production API or database connected to the application.

## Implemented Features

### Authentication

- Freight Owner and Transporter account registration.
- Email and form validation.
- Password validation requiring:
  - 8–15 characters;
  - at least one uppercase letter;
  - at least one number;
  - at least one symbol.
- Duplicate registered-email protection.
- Login for browser-registered Freight Owners and Transporters.
- Seeded Admin demonstration login.
- "Remember me" support:
  - remembered sessions use `localStorage`;
  - non-remembered sessions use `sessionStorage`.
- Role-based redirect after login.

### Browser-side password storage

For newly registered Freight Owner and Transporter accounts, the password is not stored as plain text. The browser implementation:

1. creates a random salt;
2. derives a password hash using PBKDF2 with SHA-256;
3. stores the hash and salt with the locally persisted user record.

This is suitable only for the current browser-based assessment MVP and is **not a replacement for server-side authentication in production**.

### Password recovery

- Forgot-password page.
- Registered-account lookup by email.
- Temporary password-reset request stored in the current browser session.
- Reset token with a 15-minute lifetime.
- New salt and password hash generated after a successful reset.
- Successful reset redirects back to login.

No real email, OTP, or external recovery service is used.

### Role-based routing

Protected routes prevent unauthenticated users from opening role dashboards directly. Authenticated users who attempt to open another role's dashboard are redirected to their own role area.

### Responsive authentication UI

The Login, Registration, Forgot Password, and Reset Password pages include desktop/tablet/mobile layouts and form accessibility features such as labels, error messages, focus handling, and ARIA state where applicable.

## Application Routes

| Route              | Access        | Current purpose                                          |
| ------------------ | ------------- | -------------------------------------------------------- |
| `/`                | Public        | Redirects to `/login`                                    |
| `/login`           | Public        | Sign in                                                  |
| `/register`        | Public        | Register Freight Owner or Transporter account            |
| `/forgot-password` | Public        | Start browser-based password recovery                    |
| `/reset-password`  | Recovery flow | Reset password using the temporary browser-session token |
| `/freight-owner`   | Freight Owner | Freight Owner dashboard                                  |
| `/transporter`     | Transporter   | Transporter dashboard                                    |
| `/admin`           | Admin         | Administrator dashboard                                  |
| `*`                | Public        | Not-found page                                           |

## Getting Started

### Prerequisites

Install:

- **Node.js 20.19+ or 22.12+**
- **npm**

Vite 8 requires Node.js 20.19+ or 22.12+.

### 1. Clone the repository

```bash
git clone https://github.com/LTshepoJr/Truck-Asset-Matchmaking-Platform.git
cd Truck-Asset-Matchmaking-Platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite will print the local development URL in the terminal. Open that URL in a modern browser.

### 4. Create an account or use the Admin demo account

For Freight Owner or Transporter testing, use `/register` to create a browser-local account.

For Admin testing, use the seeded demonstration credentials in the section below.

## Available Scripts

| Command           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Starts the Vite development server                     |
| `npm run build`   | Type-checks the project and creates a production build |
| `npm run lint`    | Runs Oxlint                                            |
| `npm run preview` | Serves the production build locally for preview        |

There is currently no automated `test` script configured in `package.json`.

## Demo Accounts and Test Data

### Seeded Admin account

> Demo credentials only. Do not reuse this password for any real account.

```text
Email:    tshepojr@kortestalkstech.co.za
Password: Password123!
Role:     Admin
```

Freight Owner and Transporter accounts are created through the Registration page and stored in the browser that created them.

Because the current MVP uses browser storage, accounts created in one browser/profile are not automatically available in another browser/profile or device.

## Project Structure

The main application structure currently follows this pattern:

```text
Truck-Asset-Matchmaking-Platform/
├── public/
├── src/
│   ├── assets/
│   │   └── TAMP — Full Product Design & Developer Handoff_3.png
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
│   │   │   └── FreightOwnerDashboardPage.tsx
│   │   ├── transporter/
│   │   │   └── TransporterDashboardPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   ├── paths.ts
│   │   └── ProtectedRoute.tsx
│   ├── services/
│   │   └── authService.ts
│   ├── styles/
│   │   ├── LoginPage.css
│   │   ├── PasswordRecoveryPage.css
│   │   └── RegisterPage.css
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

## Authentication and Browser Storage

The current front-end MVP uses the following browser-storage keys:

| Key                   | Storage                            | Purpose                                                  |
| --------------------- | ---------------------------------- | -------------------------------------------------------- |
| `tamp-users`          | `localStorage`                     | Registered Freight Owner and Transporter account records |
| `tamp-session`        | `sessionStorage` or `localStorage` | Current authenticated session                            |
| `tamp-password-reset` | `sessionStorage`                   | Temporary password-reset request                         |

### Session behavior

- If **Remember me** is selected, the session is stored in `localStorage`.
- Otherwise, the session is stored in `sessionStorage`.
- `ProtectedRoute` reads the active session before rendering a role area.
- A user attempting to access the wrong role route is redirected to the dashboard that matches the session role.

## Demo Guide

### Freight Owner / Transporter registration and login

1. Open `/register`.
2. Select **Freight Owner** or **Transporter**.
3. Complete the organization and account fields.
4. Create a password that meets the displayed rules.
5. Accept the terms checkbox.
6. Submit the form.
7. The application redirects to `/login`.
8. Sign in using the newly created account.
9. Confirm that the application redirects to the correct role dashboard.

### Password recovery Page

1. Register a Freight Owner or Transporter account.
2. Sign out/end the session or return to `/login`.
3. Select **Forgot password?**
4. Enter the email address of the registered browser-local account.
5. Continue to the reset page.
6. Enter and confirm a valid new password.
7. Submit the reset.
8. Sign in using the new password.

The recovery process is simulated entirely in the browser. No recovery email is sent.

### Admin login

1. Open `/login`.
2. Enter the seeded Admin credentials.
3. Submit the login form.
4. Confirm that the application opens `/admin`.

## Requirements Traceability

The table below reflects the **current repository state**, not the final intended MVP.

| Requirement | Assessment requirement                                                       | Current status      | Current implementation/evidence                                                                                                                                |
| ----------- | ---------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01       | Role-based registration/login for Freight Owner, Transporter and Admin       | **Partial**         | Freight Owner and Transporter registration/login implemented; seeded Admin login implemented; Admin self-registration is not implemented                       |
| FR-02       | Basic identity/compliance information and simulated document upload/metadata | **Partial**         | Registration captures organization, name, email and phone; new users receive a `pending` compliance status; compliance-document UI/metadata is not implemented |
| FR-03       | Freight Owner can create and view cargo loads                                | **Not implemented** | Freight Owner dashboard is currently a placeholder                                                                                                             |
| FR-04       | Transporter can create and view available trucks                             | **Not implemented** | Transporter dashboard is currently a placeholder                                                                                                               |
| FR-05       | Rule-based matching using compatibility, location and availability           | **Not implemented** | Matching module not yet present                                                                                                                                |
| FR-06       | Accept/reject a match and log the decision                                   | **Not implemented** | Match decision workflow not yet present                                                                                                                        |
| FR-07       | Accepted match produces a digital confirmation receipt                       | **Not implemented** | Confirmation/receipt module not yet present                                                                                                                    |
| FR-08       | Simulated trip tracking                                                      | **Not implemented** | Tracking module not yet present                                                                                                                                |
| FR-09       | Parties can rate/review after completion                                     | **Not implemented** | Rating workflow not yet present                                                                                                                                |
| FR-10       | Admin manages users, compliance and flags/disputes                           | **Not implemented** | Admin dashboard currently contains placeholder copy only                                                                                                       |
| FR-11       | Admin views basic platform metrics                                           | **Not implemented** | KPI/analytics UI not yet present                                                                                                                               |
| FR-12       | Key actions are available in an audit trail                                  | **Not implemented** | Audit-trail module not yet present                                                                                                                             |

## Testing Status

The repository currently defines build and lint commands but does not define an automated test suite.

Recommended checks before each submission/demo:

```bash
npm run lint
npm run build
```

Manual happy-path checks should currently cover:

- Freight Owner registration.
- Transporter registration.
- Duplicate-email rejection.
- Invalid form input handling.
- Successful login.
- Invalid login.
- Remember-me session behavior.
- Role-route protection.
- Cross-role redirect protection.
- Forgot-password lookup.
- Successful password reset.
- Invalid/expired reset handling.
- Responsive authentication pages on desktop and mobile-sized viewports.

## Known Limitations

This repository is still an in-progress assessment MVP.

- No backend API is connected.
- No database is connected.
- Registered user records exist only in browser `localStorage`.
- Authentication is simulated on the client and is not production-grade identity management.
- The seeded Admin demonstration password is present in front-end source code.
- Password recovery does not send a real email or OTP.
- The temporary password-reset request exists only in the active browser session.
- Freight Owner load posting is not yet implemented.
- Transporter truck posting is not yet implemented.
- Rule-based matchmaking is not yet implemented.
- Accept/reject decisions and confirmation receipts are not yet implemented.
- Trip tracking is not yet implemented.
- Ratings/reviews are not yet implemented.
- Admin user/compliance/dispute management and KPI views are not yet implemented.
- Audit logging is not yet implemented.
- No automated test framework/test suite is currently configured.

These limitations are acceptable only while the project is being developed as a simplified front-end demonstration. A production implementation should move identity, authorization, persistence, audit data, recovery, and business rules to trusted backend services.

## Planned Next Steps

The remaining work should be implemented in the order that completes the core TAMP journey:

1. Build the Freight Owner dashboard and cargo-load posting flow.
2. Build the Transporter dashboard and available-truck posting flow.
3. Add browser-side data models/storage for loads and trucks.
4. Implement transparent rule-based match recommendations using capacity, compatibility, location, and availability.
5. Add match Accept/Reject actions and audit events.
6. Generate a digital confirmation/receipt for accepted matches.
7. Add mock trip status/coordinate tracking.
8. Add post-completion ratings and comments.
9. Build Admin user/compliance, flag/dispute, KPI, and audit views.
10. Add automated tests for critical flows and validation/permission/error cases.

---

**TAMP — Truck Asset Matchmaking Platform**  
Front-end MVP for the Industrial Computing Engineering (Pty) Ltd technical assessment.
