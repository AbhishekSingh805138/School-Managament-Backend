---
description: Repository Information Overview
alwaysApply: true
---

# School Management System Information

## Summary
A comprehensive School Management System backend API built with TypeScript, Express, and PostgreSQL. The system provides functionality for managing students, teachers, classes, attendance, grades, fees, and reports in an educational institution.

## Structure
- **src/**: Main source code directory
  - **config/**: Environment and configuration settings
  - **controllers/**: API endpoint handlers
  - **database/**: Database connection and migrations
  - **middleware/**: Express middleware (auth, error handling, etc.)
  - **models/**: Data models
  - **routes/**: API route definitions
  - **services/**: Business logic implementation
  - **tests/**: Test files
  - **types/**: TypeScript type definitions
  - **utils/**: Utility functions
- **dist/**: Compiled JavaScript output
- **.vscode/**: VS Code configuration

## Language & Runtime
**Language**: TypeScript
**Version**: ES2020 target
**Node.js**: >=16.0.0
**Build System**: tsc (TypeScript Compiler)
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- express (^5.1.0): Web framework
- pg (^8.16.3): PostgreSQL client
- zod (^3.25.76): Schema validation
- jsonwebtoken (^9.0.2): Authentication
- bcryptjs (^3.0.2): Password hashing
- helmet (^8.1.0): Security headers
- exceljs (^4.4.0): Report generation
- puppeteer (^24.26.1): PDF generation

**Development Dependencies**:
- typescript (^5.8.3): TypeScript compiler
- jest (^30.0.4): Testing framework
- ts-jest (^29.4.0): TypeScript support for Jest
- eslint (^9.30.1): Code linting
- nodemon (^3.1.10): Development server

## Build & Installation
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Development mode
npm run dev

# Run tests
npm test

# Database migrations
npm run db:migrate
```

## Database
**Type**: PostgreSQL
**Connection**: Pool-based connection management
**Configuration**: Environment variables for host, port, credentials
**Migrations**: Custom migration system in src/database/migrations

## Testing
**Framework**: Jest with ts-jest
**Test Location**: src/tests/
**Naming Convention**: *.test.ts
**Configuration**: jest.config.js
**Run Command**:
```bash
npm test
```

## API Structure
**Base URL**: /api/v1
**Authentication**: JWT-based (login, register, refresh token)
**Main Resources**:
- /auth: Authentication endpoints
- /users: User management
- /students: Student records
- /teachers: Teacher management
- /classes: Class organization
- /attendance: Attendance tracking
- /grades: Grading system
- /fees: Fee management
- /payments: Payment processing
- /reports: Report generation

## Security Features
- Helmet for security headers
- Rate limiting and speed limiting
- Input sanitization
- Content-type validation
- Graceful error handling
- JWT authentication