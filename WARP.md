# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick commands

- Install, build, migrate, run
```bash path=null start=null
npm install
npm run build
npm run db:migrate
npm start
```

- Dev (watch) and alternatives
```bash path=null start=null
npm run dev
# If nodemon cannot execute TypeScript directly:
# npx ts-node src/index.ts
```

- Lint
```bash path=null start=null
npm run lint
npm run lint:fix
```

- Tests (Jest + ts-jest)
```bash path=null start=null
# all tests
npm test
# single file
npm test -- src/tests/authentication.test.ts
# by test name pattern
npm test -- -t "login"
# watch mode
npx jest --watch
```

- Database migrations
```bash path=null start=null
# after building
npm run db:migrate
# run only new migrations (if needed)
node dist/database/run-new-migrations.js
```

- Postman collection
```bash path=null start=null
# Import School_Management_API_Postman_Collection.json into Postman
```

## Environment

Create a .env in the project root before running the server (env is validated at startup):
```ini path=null start=null
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_management
DB_USER=postgres
DB_PASSWORD=<your_password>

# Auth
JWT_SECRET=change-me-at-least-32-characters-long-please
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Architecture overview

- Entry and lifecycle
  - Server entry is `src/index.ts` (boots Express, logs URLs, handles graceful shutdown, wires DB health via `testConnection()` and `closePool()`).
  - App composition lives in `src/app.ts`.

- HTTP stack (in `src/app.ts`)
  - Security first: `helmet`, rate limiting (`generalRateLimit`, `speedLimiter`, with a `rateLimitLogger`), extra security headers, CORS, logging (`morgan`).
  - Parsing, content-type validation, and input sanitization (middleware from `src/middleware`).
  - Health (`/health`) and API index (`/api/v1`).

- Routing layout (mounted under `/api/v1`)
  - Feature routes in `src/routes/*` cover: auth, users, academic years, semesters, subjects, classes, students, parents, teachers, attendance, attendance reports, fees, payments, fee reports, grades, assessment types, report cards, staff, and reports (export/download/schedule).
  - Each route composes middleware (authN/authZ, validation) and delegates to a controller.

- Controllers and services
  - Controllers in `src/controllers/*` are thin, orchestrating request validation and calling service methods.
  - Domain services in `src/services/*` encapsulate business logic and data access; common exports aggregated in `src/services/index.ts`.

- Data access and database
  - `src/database/connection.ts` wraps a `pg` Pool with: `testConnection`, `query(text, params)`, `getClient()` for transactions, and `closePool()` for shutdown.
  - SQL migrations live in `src/database/migrations/*.sql`; runners in `src/database/migrate.ts` and `src/database/run-new-migrations.ts` (build first, then run via `dist/...`).

- Validation and types
  - Environment is validated with Zod in `src/config/env.ts` (process exits on invalid/missing critical vars, e.g., `DB_PASSWORD`, `JWT_SECRET`).
  - Request validation via `validateBody`, `validateQuery`, `validateParams` (Zod schemas in `src/types/*`).
  - TS config uses path alias `@/*` (see `tsconfig.json`).

- Authentication and authorization
  - JWT-based auth in `src/middleware/auth.ts` reads `Authorization: Bearer <token>` and verifies with `env.JWT_SECRET`.
  - In non-test env, it ensures the user exists and is active: `SELECT ... FROM users WHERE id = $1 AND is_active = true`.
  - Test-mode convenience: tokens whose payload id matches `/^[a-z]+-\d+$/` (e.g., `admin-1`) bypass DB lookup for faster tests.
  - Role-based guard via `authorize(...roles)`.

- Reporting and scheduling
  - Report export pipeline (PDF via Puppeteer, Excel via ExcelJS, CSV/JSON) with email delivery (`nodemailer`) and scheduling (`node-cron`).
  - Routes mounted at `/api/v1/reports` (see `src/routes/reportExports.ts`) and service layer (`src/services/reportExportService.ts`, `src/services/scheduledReportService.ts`).

- Error handling
  - Centralized `errorHandler` and `notFoundHandler` in `src/middleware/errorHandler.ts` ensure consistent responses.

## Important project docs and rules

- Agent rules (source of truth for basics): `.zencoder/rules/repo.md`
  - Node >= 16, build with `tsc`, npm scripts provided, base API under `/api/v1`, and security middleware enabled by default.
- API testing: `Postman_Collection_README.md` (import `School_Management_API_Postman_Collection.json`).
- Report export details: `REPORT_EXPORT_README.md` (formats, scheduling, email, endpoints, env).
- Test config: `jest.config.js` (roots under `src`, `setupFiles` -> `src/tests/setup.ts`).
- Status and workplan: `API_TEST_RESULTS.md`, `PRODUCTION_READINESS_TASKS.md`.
