# FoodBook Company Launch Checklist

This checklist is tailored to the current codebase in:

- `backend`
- `frontend-new`
- `vendor`
- `admin`

Current project status:

- Strong demo / college project / MVP
- Not yet ready for company-level launch

Target status:

- Secure
- Stable
- Testable
- Deployable
- Maintainable by a team

## Phase 1: Critical Before Any Real Launch

These are mandatory. Do not launch publicly before these are done.

### 1. Remove hardcoded credentials and secrets

Current issues:

- Admin login is hardcoded in `backend/src/admin/routes/adminRoutes.js`
- Seeded owner passwords are stored in source in `backend/src/utils/vendorSeedData.js`

Required work:

- Move all default credentials to environment variables or one-time seed inputs
- Never keep production passwords in source control
- Add separate `.env` values for development, staging, and production
- Rotate `JWT_SECRET` before production launch

Done when:

- No real passwords exist in repo files
- Admin bootstrap is handled safely
- Production secrets are injected from hosting platform

### 2. Fix authentication and authorization fully

Required work:

- Keep role-based access strict for `user`, `vendor`, `admin`
- Add password reset flow
- Add refresh-token or secure session renewal strategy
- Invalidate tokens on logout if you want stronger session control
- Add account lockout or rate limit on repeated login failures

Done when:

- Auth works safely across reopen, refresh, expiry, and invalid token cases
- Unauthorized users cannot access admin/vendor routes

### 3. Fix insecure/broken admin report download

Current issue:

- `admin/src/services/adminApi.js` sends JWT in query string for PDF download
- Backend auth middleware reads token from `Authorization` header

Required work:

- Download reports using authenticated fetch
- Convert response to blob in frontend
- Trigger file download safely from blob URL
- Never send tokens in URL query params

Done when:

- Report download works in admin panel
- Token is never exposed in URL, logs, or browser history

### 4. Standardize all API calls and error handling

Current issue:

- Some vendor actions use raw `fetch()` and do not check `response.ok`

Required work:

- Replace direct `fetch()` usage with shared API helpers
- Make every API call throw on `401`, `403`, `404`, `500`
- Show proper success and failure messages in UI
- Redirect to login on expired auth where needed

Done when:

- No fake success messages appear on failed actions
- All panels behave consistently

### 5. Add backend validation to all write routes

Required work:

- Validate request bodies for restaurant, booking, table, menu, coupon, waitlist, notification routes
- Reject bad IDs, missing required fields, invalid values
- Sanitize strings before persistence

Done when:

- Backend never trusts frontend input directly
- Invalid data cannot corrupt the database

### 6. Fix fallback-data behavior

Current issue:

- Public restaurant routes can return fallback sample data even when DB has real but smaller datasets

Required work:

- Use fallback only when database is unavailable
- Never hide real DB data just because count is low
- Add a clear development/demo mode if sample data is still needed

Done when:

- Production always reflects actual database state

## Phase 2: Reliability and Production Readiness

### 7. Add testing

Required work:

- Unit tests for auth helpers and booking logic
- API integration tests for login, restaurant CRUD, booking CRUD, vendor dashboard, admin dashboard
- Frontend smoke tests for login and key flows
- Regression tests for booking, QR, and admin actions

Minimum coverage areas:

- User register/login
- Vendor register/login
- Admin login
- Booking create/update/delete
- Restaurant create/update/delete
- Protected route access

Done when:

- Team can change code with confidence
- CI catches breakages before deploy

### 8. Add lint/test scripts for backend and CI

Required work:

- Add ESLint/formatting for backend
- Add `npm test` script in backend
- Add CI workflow for:
  - install
  - lint
  - build
  - test

Done when:

- Every PR or deployment candidate is automatically checked

### 9. Clean large files and improve architecture

Current issue:

- `vendor/src/pages/VendorPanel.jsx` is too large
- `backend/src/admin/routes/adminRoutes.js` is too large

Required work:

- Split vendor panel into sections/components
- Move backend business logic into services/controllers
- Keep routes thin
- Create reusable form/table modules where possible

Done when:

- Files are easier to maintain
- New teammates can work faster

### 10. Improve database design and operations

Required work:

- Add indexes for frequently queried fields
- Review uniqueness constraints
- Prevent duplicate bookings where needed
- Add backup and restore strategy
- Add migration strategy for schema changes

Done when:

- DB remains fast and safe under real usage

### 11. Add monitoring and logs

Required work:

- Structured backend logs
- Error monitoring service
- Uptime checks
- Admin audit logs for destructive actions

Examples:

- Who deleted a restaurant
- Who changed booking status
- Who created or removed vendors

Done when:

- Failures are visible quickly
- Important admin actions are traceable

## Phase 3: Business Features Needed for Real Customers

### 12. Real notification delivery

Required work:

- Integrate working email delivery
- Integrate working SMS delivery
- Add retry/failure handling
- Store delivery status

Done when:

- Booking confirmations and reminders are reliable

### 13. Real payment flow

Required work:

- Integrate a production payment gateway
- Handle failed payments
- Handle duplicate callbacks/retries
- Save verified payment state
- Link payment state to booking state safely

Done when:

- Payment success/failure is trustworthy

### 14. Booking conflict prevention

Required work:

- Prevent double booking
- Lock or reserve tables during booking flow
- Re-check table availability before confirmation
- Handle timezone/date consistency properly

Done when:

- Two users cannot reserve the same table/slot incorrectly

### 15. Admin operations tooling

Required work:

- Better filters/search for users, vendors, restaurants, bookings
- Bulk actions if needed
- Export reports properly
- Safer delete confirmations
- Soft delete for sensitive records if business requires it

Done when:

- Admin panel is usable for daily operations, not just demo browsing

## Phase 4: Frontend Quality

### 16. Fix current lint issues

Current issues:

- `frontend-new/src/components/SiteShell.jsx`
- `frontend-new/src/pages/customer/MyBookings.jsx`

Required work:

- Remove effect patterns causing synchronous state updates flagged by React lint rules

Done when:

- All frontend lint scripts pass cleanly

### 17. Accessibility and UX

Required work:

- Keyboard-friendly navigation
- Focus states
- Better labels and form errors
- Color contrast verification
- Better loading/empty/error states

Done when:

- Product is usable beyond ideal demo conditions

### 18. Performance optimization

Required work:

- Code splitting by route where useful
- Lazy load heavy sections
- Optimize images
- Review large bundles
- Cache repeated dashboard requests where appropriate

Done when:

- First load feels fast on normal mobile networks

## Phase 5: Deployment and Team Operations

### 19. Deployment environments

Required work:

- Separate local, staging, and production environments
- Production MongoDB configuration
- Production frontend URLs
- Strict CORS configuration
- SSL / HTTPS everywhere

Done when:

- You can test changes safely before live release

### 20. CI/CD and rollback

Required work:

- Automatic deploy from main branch or release branch
- Pre-deploy checks
- Health check after deploy
- Rollback plan

Done when:

- Releases are repeatable and safer

### 21. Team documentation

Required work:

- Setup guide
- Architecture overview
- Environment variable list
- Seed instructions
- Deployment steps
- Incident response basics

Done when:

- Another developer can run and maintain the system without guessing

## Recommended Order For This Codebase

Work in this order:

1. Remove hardcoded credentials and fix auth security
2. Fix admin report download token handling
3. Standardize API helpers and vendor/admin error handling
4. Fix fallback-data behavior
5. Fix frontend lint errors
6. Add backend lint/test setup
7. Add API and auth tests
8. Split large files into cleaner modules
9. Add monitoring/logging
10. Add production-grade payment and notification handling

## Launch Score Targets

You can use this rough readiness model:

- `0-40%`: demo only
- `40-60%`: MVP
- `60-75%`: internal beta
- `75-90%`: soft launch candidate
- `90%+`: stronger production readiness

Current estimated readiness:

- `45-55%`

Main reason:

- Feature-rich product, but security, reliability, and testing still need work

## Suggested Immediate Sprint

If working as a small team, do this first:

### Sprint 1

- Remove hardcoded admin and seeded plaintext passwords
- Fix admin report download
- Replace raw `fetch()` in vendor panel with shared API helpers
- Fix frontend lint errors

### Sprint 2

- Add backend validation coverage
- Add backend linting
- Add auth and booking API tests

### Sprint 3

- Refactor large files
- Add logging, monitoring, and audit trails
- Prepare staging deployment

## Final Goal

This project can become company-launch quality, but it needs:

- security hardening
- test coverage
- operational readiness
- cleaner architecture

Do not treat the current version as production-ready yet.
