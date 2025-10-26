# School Management System API - Postman Collection

## Overview

This Postman collection provides complete API testing coverage for the School Management System, including all endpoints with sample request payloads and proper authentication setup.

## Collection Features

### 🔧 **Automatic Token Management**
- Collection variables automatically store authentication tokens
- Tokens are set via test scripts after successful login/registration
- Different tokens for different user roles (admin, teacher, student, parent, staff)

### 📁 **Organized Structure**
1. **🏥 System Health & Info** - Health checks and API documentation
2. **🔐 Authentication** - User registration and login for all roles
3. **👥 User Management** - User CRUD operations
4. **📅 Academic Years & Semesters** - Academic period management
5. **📚 Subjects** - Subject management and statistics
6. **🏫 Classes** - Class management and subject assignments
7. **👨‍🏫 Teachers** - Teacher profiles and assignments
8. **👨‍🎓 Students** - Student management and enrollment
9. **👨‍👩‍👧‍👦 Parents** - Parent-student relationships and portal access
10. **📋 Attendance** - Attendance marking and reporting
11. **💰 Fee Management** - Fee categories and assignments
12. **💳 Payments** - Payment processing and receipts
13. **📊 Grades & Assessment** - Grade entry and report cards
14. **👷‍♂️ Staff Management** - Non-teaching staff management
15. **📈 Reports & Analytics** - Comprehensive reporting system

## Setup Instructions

### 1. Import the Collection
1. Open Postman
2. Click "Import" button
3. Select the `School_Management_API_Postman_Collection.json` file
4. Click "Import"

### 2. Configure Environment Variables
The collection uses these variables (automatically managed):
- `baseUrl`: API base URL (default: http://localhost:3000)
- `authToken`: Current authentication token
- `adminToken`: Admin user token
- `teacherToken`: Teacher user token
- `studentToken`: Student user token
- `parentToken`: Parent user token
- `staffToken`: Staff user token

### 3. Update Base URL (if needed)
If your API runs on a different port or host:
1. Go to Collection Variables
2. Update the `baseUrl` value
3. Save the collection

## Usage Guide

### 🚀 **Quick Start Workflow**

1. **Start with System Health**
   ```
   GET /health - Check if API is running
   GET /api/v1 - View API documentation
   ```

2. **Register Users** (Run in order)
   ```
   POST /api/v1/auth/register - Register Admin (sets adminToken)
   POST /api/v1/auth/register - Register Teacher (sets teacherToken)
   POST /api/v1/auth/register - Register Student (sets studentToken)
   POST /api/v1/auth/register - Register Parent (sets parentToken)
   POST /api/v1/auth/register - Register Staff (sets staffToken)
   ```

3. **Set Up Academic Structure**
   ```
   POST /api/v1/academic-years - Create Academic Year
   POST /api/v1/semesters - Create Semester
   POST /api/v1/subjects - Create Subjects
   POST /api/v1/classes - Create Classes
   ```

4. **Manage Users and Assignments**
   ```
   POST /api/v1/teachers - Create Teacher Profiles
   POST /api/v1/students - Create Student Profiles
   POST /api/v1/teachers/assign-subject - Assign Subjects to Teachers
   POST /api/v1/classes/{id}/subjects - Assign Subjects to Classes
   ```

5. **Daily Operations**
   ```
   POST /api/v1/attendance - Mark Attendance
   POST /api/v1/fees/categories - Create Fee Categories
   POST /api/v1/fees/assign-students - Assign Fees
   POST /api/v1/payments - Record Payments
   POST /api/v1/grades - Enter Grades
   ```

### 🔐 **Authentication Flow**

Each request automatically uses the appropriate token based on the endpoint's authorization requirements:

- **Admin Token**: Full system access
- **Teacher Token**: Teaching-related operations
- **Student Token**: Own data access only
- **Parent Token**: Child data access only
- **Staff Token**: Administrative support functions

### 📝 **Sample Data Included**

The collection includes realistic sample data for:
- User profiles with proper validation
- Academic years and semesters
- Subjects with codes and credit hours
- Classes with capacity and room assignments
- Student enrollment with guardian information
- Teacher qualifications and specializations
- Attendance records with different statuses
- Fee categories with various frequencies
- Payment records with different methods
- Grades with assessment types

### 🧪 **Testing Different Scenarios**

#### **Positive Test Cases**
- All endpoints include valid request payloads
- Proper authentication headers
- Realistic data relationships

#### **Negative Test Cases** (Modify requests to test)
- Remove required fields to test validation
- Use invalid IDs to test error handling
- Use wrong authentication tokens to test authorization
- Send malformed JSON to test error responses

#### **Edge Cases**
- Large request payloads
- Special characters in text fields
- Boundary values for numbers and dates
- Concurrent requests

## Request Examples

### Authentication
```json
// Register Admin
POST /api/v1/auth/register
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@school.com",
  "password": "AdminPass123!",
  "role": "admin",
  "phone": "+1234567890"
}

// Login
POST /api/v1/auth/login
{
  "email": "admin@school.com",
  "password": "AdminPass123!"
}
```

### Student Management
```json
// Create Student
POST /api/v1/students
{
  "userId": "3",
  "studentId": "STU001",
  "classId": "1",
  "enrollmentDate": "2024-08-01",
  "guardianName": "Jane Johnson",
  "guardianPhone": "+1234567890",
  "guardianEmail": "parent@school.com",
  "emergencyContact": "+1234567891"
}
```

### Attendance Management
```json
// Mark Bulk Attendance
POST /api/v1/attendance/bulk
{
  "classId": "1",
  "date": "2024-01-16",
  "attendance": [
    {
      "studentId": "1",
      "status": "present",
      "remarks": "On time"
    },
    {
      "studentId": "2",
      "status": "absent",
      "remarks": "Sick"
    }
  ]
}
```

### Fee Management
```json
// Create Fee Category
POST /api/v1/fees/categories
{
  "name": "Tuition Fee",
  "description": "Monthly tuition fee",
  "amount": 5000,
  "frequency": "monthly",
  "isMandatory": true,
  "academicYearId": "1"
}

// Record Payment
POST /api/v1/payments
{
  "studentFeeId": "1",
  "amount": 2500,
  "paymentMethod": "cash",
  "transactionId": "TXN001",
  "receiptNumber": "RCP001"
}
```

## Query Parameters Guide

### Pagination
```
?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Filtering
```
// Students by class
?classId=1&isActive=true

// Attendance by date range
?startDate=2024-01-01&endDate=2024-01-31&status=present

// Fees by status
?status=pending&feeCategoryId=1
```

### Search
```
// Search users
?search=john&role=teacher

// Search subjects
?search=math&isActive=true
```

## Response Format

All API responses follow this consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "pagination": {  // For paginated responses
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
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if you're logged in (run login request first)
   - Verify the correct token is being used
   - Check if token has expired

2. **403 Forbidden**
   - User role doesn't have permission for this endpoint
   - Use admin token for administrative operations

3. **400 Bad Request**
   - Check request payload format
   - Verify all required fields are included
   - Check data types and validation rules

4. **404 Not Found**
   - Verify the endpoint URL is correct
   - Check if the resource ID exists
   - Ensure the API server is running

5. **500 Internal Server Error**
   - Check API server logs
   - Verify database connection
   - Check for data constraint violations

### Debug Tips

1. **Enable Postman Console**
   - View → Show Postman Console
   - See detailed request/response logs

2. **Check Collection Variables**
   - Ensure tokens are properly set
   - Verify baseUrl is correct

3. **Test Authentication First**
   - Always start with health check
   - Register/login before testing other endpoints

4. **Use Proper Sequence**
   - Create academic years before semesters
   - Create users before creating profiles
   - Create classes before assigning students

## Support

For issues with the API or collection:
1. Check the API server logs
2. Verify database connectivity
3. Review the API documentation
4. Test with minimal request payloads first

## Collection Maintenance

To keep the collection updated:
1. Add new endpoints as they're implemented
2. Update sample data to reflect current requirements
3. Add test scripts for automated validation
4. Update documentation for new features

---

**Happy Testing! 🚀**