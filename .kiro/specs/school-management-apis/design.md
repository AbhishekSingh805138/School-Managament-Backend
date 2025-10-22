# School Management System API Design

## Overview

This design document outlines the architecture and implementation approach for completing the School Management System APIs. The system builds upon the existing authentication and user management foundation, extending it with comprehensive school administration capabilities including student management, teacher assignments, attendance tracking, fee management, and academic performance monitoring.

The design follows RESTful API principles, maintains the existing TypeScript/Express.js/PostgreSQL stack, and leverages the current Zod validation and JWT authentication patterns.

## Architecture

### Current Foundation
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with connection pooling
- **Validation**: Zod schemas for request/response validation
- **Authentication**: JWT-based with role-based access control
- **Error Handling**: Centralized error middleware with custom AppError class
- **Project Structure**: Layered architecture (routes → controllers → database)

### Extended Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Routes    │    │   Controllers   │    │   Database      │
│                 │    │                 │    │                 │
│ • Auth          │    │ • Auth          │    │ • Users         │
│ • Users         │    │ • Users         │    │ • Students      │
│ • Students      │────┤ • Students      │────┤ • Teachers      │
│ • Teachers      │    │ • Teachers      │    │ • Classes       │
│ • Classes       │    │ • Classes       │    │ • Subjects      │
│ • Subjects      │    │ • Subjects      │    │ • Attendance    │
│ • Attendance    │    │ • Attendance    │    │ • Fees          │
│ • Fees          │    │ • Fees          │    │ • Grades        │
│ • Grades        │    │ • Grades        │    │ • Academic Years│
│ • Reports       │    │ • Reports       │    │ • Enrollments   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. Database Schema Extensions

Building on the existing `users` table, the following tables will be added:

#### Academic Structure Tables
```sql
-- Academic years and semesters
academic_years (id, name, start_date, end_date, is_active, created_at, updated_at)
semesters (id, academic_year_id, name, start_date, end_date, is_active, created_at, updated_at)

-- Subjects and curriculum
subjects (id, name, code, description, credit_hours, is_active, created_at, updated_at)

-- Classes (extending existing class types)
classes (id, name, grade, section, teacher_id, capacity, room, description, academic_year_id, is_active, created_at, updated_at)

-- Class-subject assignments
class_subjects (id, class_id, subject_id, teacher_id, created_at, updated_at)
```

#### Student Management Tables
```sql
-- Student profiles (extending existing student types)
students (id, user_id, student_id, class_id, enrollment_date, guardian_name, guardian_phone, guardian_email, emergency_contact, medical_info, is_active, created_at, updated_at)

-- Student-parent relationships
student_parents (id, student_id, parent_user_id, relationship_type, is_primary, created_at, updated_at)

-- Student class history
student_class_history (id, student_id, class_id, academic_year_id, start_date, end_date, created_at, updated_at)
```

#### Attendance Tables
```sql
-- Daily attendance records
attendance (id, student_id, class_id, date, status, marked_by, remarks, created_at, updated_at)

-- Attendance status enum: 'present', 'absent', 'late', 'excused'
```

#### Fee Management Tables
```sql
-- Fee categories and structures
fee_categories (id, name, description, amount, frequency, is_mandatory, academic_year_id, is_active, created_at, updated_at)

-- Student fee assignments
student_fees (id, student_id, fee_category_id, amount, due_date, status, created_at, updated_at)

-- Payment records
payments (id, student_fee_id, amount, payment_date, payment_method, transaction_id, receipt_number, processed_by, created_at, updated_at)
```

#### Academic Performance Tables
```sql
-- Assessment types and grading
assessment_types (id, name, description, weightage, is_active, created_at, updated_at)

-- Student grades
grades (id, student_id, subject_id, assessment_type_id, marks_obtained, total_marks, grade_letter, semester_id, recorded_by, created_at, updated_at)

-- Report cards
report_cards (id, student_id, semester_id, overall_grade, overall_percentage, rank, remarks, generated_at, created_at, updated_at)
```

### 2. API Endpoints Structure

#### Student Management APIs
```
POST   /api/v1/students                    # Create student profile
GET    /api/v1/students                    # List students (with filters)
GET    /api/v1/students/:id                # Get student details
PUT    /api/v1/students/:id                # Update student profile
DELETE /api/v1/students/:id                # Deactivate student
GET    /api/v1/students/:id/attendance     # Get student attendance
GET    /api/v1/students/:id/grades         # Get student grades
GET    /api/v1/students/:id/fees           # Get student fee status
POST   /api/v1/students/:id/parents        # Link parent to student
```

#### Teacher Management APIs
```
POST   /api/v1/teachers                    # Create teacher profile
GET    /api/v1/teachers                    # List teachers
GET    /api/v1/teachers/:id                # Get teacher details
PUT    /api/v1/teachers/:id                # Update teacher profile
DELETE /api/v1/teachers/:id                # Deactivate teacher
GET    /api/v1/teachers/:id/classes        # Get assigned classes
GET    /api/v1/teachers/:id/subjects       # Get assigned subjects
POST   /api/v1/teachers/:id/assignments    # Assign teacher to class/subject
```

#### Class Management APIs
```
POST   /api/v1/classes                     # Create class
GET    /api/v1/classes                     # List classes
GET    /api/v1/classes/:id                 # Get class details
PUT    /api/v1/classes/:id                 # Update class
DELETE /api/v1/classes/:id                 # Deactivate class
GET    /api/v1/classes/:id/students        # Get class students
GET    /api/v1/classes/:id/subjects        # Get class subjects
POST   /api/v1/classes/:id/subjects        # Assign subject to class
```

#### Attendance Management APIs
```
POST   /api/v1/attendance                  # Mark attendance
GET    /api/v1/attendance                  # Get attendance records
PUT    /api/v1/attendance/:id              # Update attendance record
GET    /api/v1/attendance/class/:classId   # Get class attendance
GET    /api/v1/attendance/student/:studentId # Get student attendance
POST   /api/v1/attendance/bulk             # Bulk attendance marking
```

#### Fee Management APIs
```
POST   /api/v1/fees/categories             # Create fee category
GET    /api/v1/fees/categories             # List fee categories
POST   /api/v1/fees/assign                 # Assign fees to students
GET    /api/v1/fees/student/:studentId     # Get student fees
POST   /api/v1/payments                    # Record payment
GET    /api/v1/payments                    # List payments
GET    /api/v1/payments/student/:studentId # Get student payments
GET    /api/v1/fees/reports/due            # Fee due reports
```

#### Academic Performance APIs
```
POST   /api/v1/grades                      # Record grades
GET    /api/v1/grades/student/:studentId   # Get student grades
GET    /api/v1/grades/class/:classId       # Get class grades
PUT    /api/v1/grades/:id                  # Update grade
POST   /api/v1/report-cards/generate       # Generate report cards
GET    /api/v1/report-cards/student/:studentId # Get report card
```

#### Subject Management APIs
```
POST   /api/v1/subjects                    # Create subject
GET    /api/v1/subjects                    # List subjects
GET    /api/v1/subjects/:id                # Get subject details
PUT    /api/v1/subjects/:id                # Update subject
DELETE /api/v1/subjects/:id                # Deactivate subject
```

#### Academic Year Management APIs
```
POST   /api/v1/academic-years              # Create academic year
GET    /api/v1/academic-years              # List academic years
GET    /api/v1/academic-years/:id          # Get academic year details
PUT    /api/v1/academic-years/:id          # Update academic year
POST   /api/v1/academic-years/:id/semesters # Create semester
```

#### Reporting APIs
```
GET    /api/v1/reports/attendance          # Attendance reports
GET    /api/v1/reports/academic            # Academic performance reports
GET    /api/v1/reports/financial           # Financial reports
GET    /api/v1/reports/enrollment          # Enrollment reports
POST   /api/v1/reports/export              # Export reports
```

### 3. Authentication and Authorization Matrix

| Role    | Students | Teachers | Classes | Subjects | Attendance | Fees | Grades | Reports |
|---------|----------|----------|---------|----------|------------|------|--------|---------|
| Admin   | CRUD     | CRUD     | CRUD    | CRUD     | Read       | CRUD | Read   | All     |
| Teacher | Read     | Read Own | Read    | Read     | CRUD Own   | Read | CRUD Own| Own Classes |
| Student | Read Own | Read     | Read Own| Read     | Read Own   | Read Own| Read Own| Own     |
| Parent  | Read Child| Read    | Read Child| Read    | Read Child | Read Child| Read Child| Child |
| Staff   | Read     | Read     | Read    | Read     | Read       | CRUD | Read   | Limited |

## Data Models

### Extended Type Definitions

#### Student Types
```typescript
export const CreateStudentSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  studentId: z.string().min(1),
  classId: z.string().uuid(),
  enrollmentDate: z.string().datetime(),
  guardianName: z.string().min(2),
  guardianPhone: z.string().min(10),
  guardianEmail: z.string().email().optional(),
  emergencyContact: z.string().min(10),
  medicalInfo: z.string().optional(),
  dateOfBirth: z.string().datetime(),
  address: z.string().optional(),
});

export const StudentResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  studentId: z.string(),
  classId: z.string().uuid(),
  enrollmentDate: z.string(),
  guardianName: z.string(),
  guardianPhone: z.string(),
  guardianEmail: z.string().nullable(),
  emergencyContact: z.string(),
  medicalInfo: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
  class: z.object({
    name: z.string(),
    grade: z.string(),
    section: z.string(),
  }),
});
```

#### Attendance Types
```typescript
export const AttendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);

export const CreateAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  date: z.string().datetime(),
  status: AttendanceStatusSchema,
  remarks: z.string().optional(),
});

export const BulkAttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().datetime(),
  attendance: z.array(z.object({
    studentId: z.string().uuid(),
    status: AttendanceStatusSchema,
    remarks: z.string().optional(),
  })),
});
```

#### Fee Types
```typescript
export const FeeCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  frequency: z.enum(['monthly', 'quarterly', 'semester', 'annual', 'one-time']),
  isMandatory: z.boolean(),
  academicYearId: z.string().uuid(),
});

export const PaymentSchema = z.object({
  studentFeeId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'cheque', 'online']),
  transactionId: z.string().optional(),
  receiptNumber: z.string().optional(),
});
```

#### Grade Types
```typescript
export const CreateGradeSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  assessmentTypeId: z.string().uuid(),
  marksObtained: z.number().min(0),
  totalMarks: z.number().positive(),
  semesterId: z.string().uuid(),
});

export const GradeResponseSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  assessmentTypeId: z.string().uuid(),
  marksObtained: z.number(),
  totalMarks: z.number(),
  percentage: z.number(),
  gradeLetter: z.string(),
  semesterId: z.string().uuid(),
  recordedBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

## Error Handling

### Extended Error Types
- **ValidationError**: Invalid input data (400)
- **AuthenticationError**: Invalid or missing authentication (401)
- **AuthorizationError**: Insufficient permissions (403)
- **NotFoundError**: Resource not found (404)
- **ConflictError**: Resource already exists or constraint violation (409)
- **BusinessLogicError**: School-specific business rule violations (422)
  - Student already enrolled in class
  - Teacher assignment conflicts
  - Fee payment exceeds due amount
  - Grade entry outside valid range

### Business Rule Validations
- Class capacity limits
- Teacher availability for multiple classes
- Academic year date constraints
- Fee payment validation
- Grade entry authorization
- Attendance marking time windows

## Testing Strategy

### Unit Testing
- **Controllers**: Test each endpoint with various input scenarios
- **Validation**: Test Zod schemas with valid/invalid data
- **Business Logic**: Test calculation functions (grades, fees, attendance percentages)
- **Database Queries**: Test query functions with mock data

### Integration Testing
- **API Endpoints**: Test complete request-response cycles
- **Authentication Flow**: Test role-based access control
- **Database Transactions**: Test multi-table operations
- **Error Scenarios**: Test error handling and rollback mechanisms

### Test Data Management
- **Fixtures**: Create test data for users, students, classes, subjects
- **Cleanup**: Ensure test isolation with proper data cleanup
- **Mocking**: Mock external services (email notifications, payment gateways)

### Performance Testing
- **Load Testing**: Test API performance with multiple concurrent users
- **Database Performance**: Test query performance with large datasets
- **Memory Usage**: Monitor memory consumption during bulk operations

## Security Considerations

### Data Protection
- **PII Encryption**: Encrypt sensitive student and parent information
- **Access Logging**: Log all data access for audit trails
- **Data Retention**: Implement policies for historical data management

### API Security
- **Rate Limiting**: Implement rate limiting per user role
- **Input Sanitization**: Sanitize all user inputs to prevent injection attacks
- **CORS Configuration**: Restrict cross-origin requests appropriately

### Role-Based Security
- **Granular Permissions**: Implement fine-grained access control
- **Context-Aware Authorization**: Ensure users can only access their related data
- **Session Management**: Implement secure session handling and timeout

## Performance Optimization

### Database Optimization
- **Indexing Strategy**: Create indexes on frequently queried columns
- **Query Optimization**: Optimize complex queries with joins
- **Connection Pooling**: Maintain efficient database connection management

### Caching Strategy
- **Response Caching**: Cache frequently accessed data (class lists, subjects)
- **Session Caching**: Cache user session data
- **Query Result Caching**: Cache expensive query results

### API Performance
- **Pagination**: Implement consistent pagination across all list endpoints
- **Field Selection**: Allow clients to specify required fields
- **Bulk Operations**: Provide bulk endpoints for mass operations

## Deployment Considerations

### Environment Configuration
- **Database Migrations**: Implement automated database schema migrations
- **Environment Variables**: Secure configuration management
- **Health Checks**: Implement comprehensive health check endpoints

### Monitoring and Logging
- **Application Monitoring**: Monitor API performance and errors
- **Database Monitoring**: Track database performance and slow queries
- **Business Metrics**: Track school-specific metrics (enrollment, attendance rates)

### Backup and Recovery
- **Database Backups**: Automated daily backups with retention policy
- **Data Recovery**: Procedures for data recovery and system restoration
- **Disaster Recovery**: Plan for system failure scenarios