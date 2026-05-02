# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

There is no test suite configured.

## Architecture Overview

**RideMa** is a Next.js 16 multi-vendor vehicle rental platform (French-language UI). It supports three user roles — `user`, `partner`, and `admin` — with role-based routing enforced in middleware.

### Role-Based Rendering

The root page ([src/app/page.tsx](src/app/page.tsx)) is a server component that fetches the session and DB user, then renders one of three views:
- `AdminDashboard` — for `role === "admin"`
- `PartnerDashboard` — for `role === "partner"`
- `PublicHome` — for unauthenticated visitors or regular users

### Middleware

[src/proxy.ts](src/proxy.ts) defines the middleware logic (exported as `proxy`) and the `config` matcher. **Note:** Next.js requires middleware to live in `src/middleware.ts` — this re-export file does not currently exist. The rules are:
- Allows public access to `/` and `/api/auth/*`
- Redirects unauthenticated users to `/`
- Blocks non-admins from `/admin/*`
- Allows `/partner/onboarding/*` regardless of role (so users mid-signup can complete onboarding)
- For protected API routes: returns `401` instead of redirecting

### Auth

[src/auth.ts](src/auth.ts) uses NextAuth v5 (beta) with two providers:
- **Credentials** — email/password with bcrypt
- **Google OAuth** — auto-creates a user record on first sign-in

JWT callback always re-fetches `role` from MongoDB to keep it current. Session strategy is JWT with 10-day max age. Custom sign-in page is at `/signin`.

Email verification uses a 6-digit OTP sent via Resend ([src/lib/sendMail.ts](src/lib/sendMail.ts)).

### Database

MongoDB via Mongoose with a singleton connection cached on `global.mongooseConn` ([src/lib/db.ts](src/lib/db.ts)). Always call `await dbConnect()` at the top of every API route and server component that needs DB access.

**Models:**
- `User` ([src/models/user.model.ts](src/models/user.model.ts)) — core user record with `partnerOnBoardingSteps` (0–8), `partnerStatus`, `videoKycStatus`, and OTP fields
- `Vehicle` ([src/models/vehicle.model.ts](src/models/vehicle.model.ts)) — vehicle registration with pricing fields (`baseFare`, `pricePerKM`, `waitingCharge`) and approval status
- `PartnerDocs` ([src/models/partnerDocs.model.ts](src/models/partnerDocs.model.ts)) — CNIE, FAN, and driver's license Cloudinary URLs
- `PartnerBank` ([src/models/partnerBank.model.ts](src/models/partnerBank.model.ts)) — bank account and mobile payment info

### Partner Onboarding Flow

Partners complete 8 ordered steps tracked by `partnerOnBoardingSteps` on the User model. [src/app/components/PartnerDashboard.tsx](src/app/components/PartnerDashboard.tsx) renders a stepper UI driven by this value:

1. Vehicle registration (`/partner/onboarding/vehicle`)
2. Documents upload (`/partner/onboarding/documents`) — uploaded to Cloudinary
3. Bank info (`/partner/onboarding/bank`)
4. Admin document review (admin approves/rejects)
5. Video KYC (Jitsi via [src/app/components/ZegoComponent.tsx](src/app/components/ZegoComponent.tsx))
6. Pricing configuration
7. Admin pricing review
8. Live / active

### Video KYC

Uses the **Jitsi Meet External API** loaded dynamically via a `<script>` tag at runtime (not bundled). The component is at `src/app/components/ZegoComponent.tsx` — the filename is a legacy misnomer; it exports `VideoKycComponent` and uses Jitsi, not ZegoCloud. (`@zegocloud/zego-uikit-prebuilt` is installed but unused.) The component is dynamically imported with `ssr: false`.

Admin starts a KYC session via `/api/admin/video-kyc/start/[id]`, which sets `videoKycRoomId` on the user and sets status to `in_progress`. Both admin and partner join `/video-kyc/[roomId]`. Admin can approve or reject from within the call UI via modals that call `POST /api/admin/video-kyc/complete`.

### State Management

Redux Toolkit with a single `user` slice ([src/redux/userSlice.ts](src/redux/userSlice.ts)) storing `userData: IUser | null`. Populated on mount by `InitUser` ([src/InitUser.ts](src/InitUser.ts)) via `useGetAdmin` hook, which calls `GET /api/user/admin` once the session is authenticated. The `IUser` type is defined in [types/user.ts](types/user.ts).

### API Routes

All API routes under `src/app/api/` follow Next.js App Router conventions. Protected routes require an active session (enforced by middleware). Admin routes under `/api/admin/*` are role-gated. Key route groups:

- `/api/auth/*` — NextAuth handlers + OTP email verification + registration
- `/api/user/admin` — returns full user document for the Redux store
- `/api/partner/onboarding/*` — vehicle, documents, bank, pricing submission
- `/api/partner/video-kyc/request` — partner requests KYC
- `/api/admin/reviews/partner/[id]/*` — approve/reject partner docs
- `/api/admin/reviews/vehicle/[id]/*` — approve/reject vehicle pricing
- `/api/admin/video-kyc/*` — start/complete KYC sessions
- `/api/admin/adminDashboard` — dashboard stats + pending review lists

### External Services

| Service | Purpose | Env var |
|---|---|---|
| MongoDB | Primary database | `MONGODB_URL` |
| NextAuth | Auth framework | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| Resend | Transactional email (OTP) | `RESEND_API_KEY` |
| Cloudinary | Document/image storage | (configured in `src/lib/cloudinary.ts`) |
| Jitsi Meet | Video KYC calls | No key required (public instance) |

`@anthropic-ai/sdk` is installed in `package.json` but not yet used in the source code.

### Key Conventions

- **Images**: Remote patterns allow only `res.cloudinary.com`. Server action body size limit is 20 MB (`next.config.ts`).
- **Animations**: Use `motion/react` (the `motion` package). Do not add `framer-motion` as a separate dependency — it is not installed.
- **Client vs Server**: Server components fetch session and DB data directly; client components use the Redux store or axios calls to API routes.
- **Language**: UI strings are in French; code, types, and comments mix English and French.
