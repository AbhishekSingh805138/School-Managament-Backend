# Phase 2 Quick Reference Guide

## 🚀 New Endpoints & Features

### Student Management Enhancements

#### New Student Endpoints
```
GET /api/students/:id/summary
```
Returns comprehensive student dashboard with:
- Personal information
- Current academic info (class, enrollment date)
- Guardian information
- Current stats (attendance %, GPA, pending fees, recent grades)

```
GET /api/students/:id/class-history
```
Returns complete history of class assignments with:
- Previous and current classes
- Academic years
- Start and end dates

```
GET /api/students/class/:classId
```
Get all students in a specific class with pagination

```
PATCH /api/students/bulk-update
```
Update multiple students at once
- Supports updating: firstName, lastName, phone, classId, guardianName, guardianPhone
- Returns success count and failed updates with reasons

#### Enhanced Student Service Methods
- `getStudentSummary(id)` - Complete student dashboard data
- `getStudentClassHistory(id)` - Class transfer history
- `getStudentsByClass(classId, params)` - Class roster
- `bulkUpdateStudents(studentIds, updateData)` - Batch updates

---

### Teacher Management Features

All teacher management features are fully implemented including:

#### Teacher Workload Analytics
```
GET /api/teachers/:id/workload
```
Returns detailed workload analysis:
- Main class assignment
- Subject specializations
- Teaching assignments (class-subject pairs)
- Total classes and subjects taught
- Weekly hours calculation
- Unique student count
- Workload intensity (normal/high/overloaded)
- Grade distribution
- Recommendations for balancing workload

#### Assignment Management
```
POST /api/teachers/assign-subject
Body: { teacherId, subjectId }
```

```
POST /api/teachers/assign-class
Body: { teacherId, classId }
```
Assigns teacher as main class teacher

```
POST /api/teachers/assign-class-subject
Body: { teacherId, classId, subjectId }
```
Assigns teacher to teach specific subject in specific class

```
POST /api/teachers/check-conflicts
Body: { teacherId, classId, subjectId }
```
Checks for scheduling conflicts before assignment

```
GET /api/teachers/suggestions/:classId/:subjectId
```
Gets optimal teacher suggestions for a class-subject assignment

---

### Attendance Management

All attendance features implemented:

#### Single Attendance
```
POST /api/attendance
Body: {
  studentId, classId, date, status,
  subjectId?, remarks?
}
```

#### Bulk Attendance
```
POST /api/attendance/bulk
Body: {
  classId, date, subjectId?,
  attendance: [
    { studentId, status, remarks? }
  ]
}
```

#### Attendance Summary
```
GET /api/attendance/student/:studentId/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```
Returns:
- Total days
- Present/absent/late/excused counts
- Attendance percentage
- Date range statistics

---

### Fee Management

Complete fee and payment system:

#### Fee Categories
```
POST /api/fees
GET /api/fees
GET /api/fees/:id
PUT /api/fees/:id
DELETE /api/fees/:id
```

#### Fee Assignment
```
POST /api/fees/assign-students
Body: {
  feeCategoryId,
  studentIds: [],
  dueDate
}
```

```
POST /api/fees/assign-class
Body: {
  feeCategoryId,
  classId,
  dueDate
}
```

#### Payments
```
POST /api/payments
Body: {
  studentFeeId,
  amountPaid,
  paymentMethod,
  transactionId?,
  paymentDate
}
```

```
GET /api/payments/summary?startDate=&endDate=
```
Returns payment statistics and analytics

```
GET /api/payments/receipt/:id
```
Get payment receipt details

---

### Grading System

Complete grading implementation:

#### Grade Entry
```
POST /api/grades
Body: {
  studentId,
  subjectId,
  assessmentTypeId,
  marksObtained,
  totalMarks,
  semesterId,
  remarks?
}
```
Automatically calculates:
- Percentage
- Grade letter (A+, A, B+, B, C+, C, D, F)

#### Assessment Types
```
POST /api/assessment-types
Body: {
  name,
  description,
  weightage,
  academicYearId
}
```

#### Report Cards
```
GET /api/report-cards/:studentId/:semesterId
```
Generates complete report card with:
- All subjects
- All assessment types
- Grade calculations
- Overall GPA

---

### Reporting System

Comprehensive reporting features:

#### Attendance Reports
```
GET /api/attendance-reports?studentId=&classId=&startDate=&endDate=&status=
```

#### Academic Reports
```
GET /api/reports/academic?studentId=&classId=&semesterId=
```

#### Financial Reports
```
GET /api/fee-reports?classId=&status=&startDate=&endDate=
```

---

## 🔐 Authorization Levels

### Student Endpoints
- **Admin**: Full access to all operations
- **Teacher**: View students in their classes
- **Student**: View own profile only
- **Parent**: View their children's profiles

### Teacher Endpoints
- **Admin**: Full access to all operations
- **Teacher**: View own profile and workload

### Attendance
- **Admin**: Full access
- **Teacher**: Mark and view attendance for their classes
- **Student**: View own attendance
- **Parent**: View children's attendance

### Fees & Payments
- **Admin**: Full access
- **Accountant/Staff**: Can record payments
- **Student/Parent**: View own fee information

### Grades
- **Admin**: Full access
- **Teacher**: Can enter/update grades for subjects they teach
- **Student**: View own grades
- **Parent**: View children's grades

---

## 📊 Database Tables Used

### New/Enhanced Tables
- `students` - Enhanced with alt_id support
- `teachers` - Complete with workload tracking
- `attendance` - With bulk entry support
- `student_class_history` - Class transfer tracking
- `fees` - Fee categories
- `payments` - Payment processing
- `grades` - Grade entries
- `assessment_types` - Assessment configuration

### Relationships
- Students ↔ Classes (with history)
- Teachers ↔ Subjects (specializations)
- Teachers ↔ Classes (main teacher)
- Teachers ↔ Class-Subjects (teaching assignments)
- Students ↔ Attendance
- Students ↔ Fees ↔ Payments
- Students ↔ Grades

---

## 🎯 Key Business Rules

### Student Management
1. Student cannot be assigned to over-capacity class
2. Class transfers update enrollment counts and history
3. Students can have multiple parents
4. Alt_id provides sequential numeric IDs

### Teacher Management
1. Teacher can be main teacher for only ONE class
2. Teacher can have multiple subject specializations
3. Teacher can teach multiple class-subject combinations
4. Workload is calculated based on credit hours and classes

### Attendance
1. Cannot mark duplicate attendance for same student/class/date
2. Bulk attendance is atomic (all or nothing)
3. Attendance can be corrected/updated
4. Attendance percentage = present days / total days

### Fees & Payments
1. Fees must be assigned before payment
2. Partial payments are supported
3. Payment cannot exceed due amount
4. Payment status: pending → partial → paid → overdue

### Grading
1. Grade letter auto-calculated from percentage
2. Duplicate grades prevented (student+subject+assessment+semester)
3. Teachers can only grade subjects they teach
4. Grade percentage = (marks obtained / total marks) × 100

---

## 🔧 Common Query Parameters

### Pagination (all GET endpoints)
```
?page=1&limit=10&sortBy=field&sortOrder=asc
```

### Filtering Examples
```
# Students
GET /api/students?search=john&classId=uuid&grade=10&isActive=true

# Teachers  
GET /api/teachers?search=smith&specialization=Math

# Attendance
GET /api/attendance?studentId=uuid&classId=uuid&date=2024-01-01&status=present

# Grades
GET /api/grades?studentId=uuid&subjectId=uuid&semesterId=uuid
```

---

## ✅ Response Format

All endpoints follow consistent response format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": {  // if applicable
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // validation errors if applicable
}
```

---

## 🧪 Testing Tips

### Student Management Tests
```typescript
// Test student summary
GET /api/students/:id/summary
// Should return complete dashboard data

// Test bulk update
PATCH /api/students/bulk-update
{
  studentIds: [id1, id2],
  updateData: { classId: newClassId }
}
```

### Teacher Workload Tests
```typescript
// Test workload calculation
GET /api/teachers/:id/workload
// Should return hours, classes, subjects, intensity
```

### Attendance Tests
```typescript
// Test bulk attendance
POST /api/attendance/bulk
{
  classId,
  date: "2024-01-01",
  attendance: [
    { studentId, status: "present" }
  ]
}
```

---

## 📱 Mobile App Integration Points

### Key Endpoints for Mobile
1. **Student Dashboard**: `GET /api/students/:id/summary`
2. **Teacher Workload**: `GET /api/teachers/:id/workload`
3. **Mark Attendance**: `POST /api/attendance/bulk`
4. **View Grades**: `GET /api/grades?studentId=:id`
5. **Fee Status**: `GET /api/fees/students?studentId=:id`
6. **Payment History**: `GET /api/payments/history/:studentId`

---

## 🚨 Important Notes

1. **Authentication Required**: All endpoints require valid JWT token
2. **Role-Based Access**: Each endpoint enforces role-based authorization
3. **Validation**: All inputs validated using Zod schemas
4. **Transactions**: Critical operations use database transactions
5. **Audit Trail**: Sensitive operations logged with user info
6. **Soft Deletes**: Records are deactivated, not deleted

---

**Last Updated**: 2025-11-01  
**Phase**: 2 - Core Business Logic (Complete)
