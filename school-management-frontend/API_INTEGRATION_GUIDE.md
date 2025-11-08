# Backend API Integration Guide

## Overview
This guide covers the integration between the Angular frontend and the Node.js/Express backend API.

## Configuration Status

### ✅ Backend Configuration
- **API URL**: `http://localhost:3000/api/v1`
- **CORS Origin**: `http://localhost:4200` (configured in backend `.env`)
- **Port**: 3000
- **Database**: PostgreSQL (configured and ready)

### ✅ Frontend Configuration
- **API URL**: `http://localhost:3000/api/v1` (configured in `environment.ts`)
- **Port**: 4200
- **Timeout**: 30 seconds
- **API Version**: v1

## API Endpoints Mapping

### Authentication Endpoints

| Frontend Service Method | Backend Endpoint | HTTP Method | Description |
|------------------------|------------------|-------------|-------------|
| `AuthService.login()` | `/auth/login` | POST | User login |
| `AuthService.register()` | `/auth/register` | POST | User registration |
| `AuthService.refreshToken()` | `/auth/refresh` | POST | Refresh JWT token |
| `AuthService.getCurrentUser()` | `/auth/profile` | GET | Get current user profile |

### Student Endpoints

| Frontend Service Method | Backend Endpoint | HTTP Method | Description |
|------------------------|------------------|-------------|-------------|
| `StudentService.getStudents()` | `/students` | GET | Get all students (paginated) |
| `StudentService.getStudent()` | `/students/:id` | GET | Get student by ID |
| `StudentService.createStudent()` | `/students` | POST | Create new student |
| `StudentService.updateStudent()` | `/students/:id` | PUT | Update student |
| `StudentService.deleteStudent()` | `/students/:id` | DELETE | Delete student |
| `StudentService.getStudentStats()` | `/students/stats` | GET | Get student statistics |

### Teacher Endpoints

| Frontend Service Method | Backend Endpoint | HTTP Method | Description |
|------------------------|------------------|-------------|-------------|
| `TeacherService.getTeachers()` | `/teachers` | GET | Get all teachers (paginated) |
| `TeacherService.getTeacher()` | `/teachers/:id` | GET | Get teacher by ID |
| `TeacherService.createTeacher()` | `/teachers` | POST | Create new teacher |
| `TeacherService.updateTeacher()` | `/teachers/:id` | PUT | Update teacher |
| `TeacherService.deleteTeacher()` | `/teachers/:id` | DELETE | Delete teacher |
| `TeacherService.getTeacherStats()` | `/teachers/stats` | GET | Get teacher statistics |

### Academic Endpoints

| Frontend Service Method | Backend Endpoint | HTTP Method | Description |
|------------------------|------------------|-------------|-------------|
| `AcademicService.getAcademicYears()` | `/academic-years` | GET | Get all academic years |
| `AcademicService.createAcademicYear()` | `/academic-years` | POST | Create academic year |
| `AcademicService.updateAcademicYear()` | `/academic-years/:id` | PUT | Update academic year |
| `AcademicService.deleteAcademicYear()` | `/academic-years/:id` | DELETE | Delete academic year |
| `AcademicService.getSemesters()` | `/semesters` | GET | Get all semesters |
| `AcademicService.createSemester()` | `/semesters` | POST | Create semester |

### Attendance Endpoints

| Frontend Service Method | Backend Endpoint | HTTP Method | Description |
|------------------------|------------------|-------------|-------------|
| `AttendanceService.getAttendance()` | `/attendance` | GET | Get attendance records |
| `AttendanceService.markAttendance()` | `/attendance` | POST | Mark attendance |
| `AttendanceService.markBulkAttendance()` | `/attendance/bulk` | POST | Mark bulk attendance |
| `AttendanceService.getAttendanceStats()` | `/attendance/stats` | GET | Get attendance statistics |

### Fee Endpoints

| Frontend Service Method | Backend Endpoint | HTTP Method | Description |
|------------------------|------------------|-------------|-------------|
| `FeeService.getFeeCategories()` | `/fees/categories` | GET | Get fee categories |
| `FeeService.createFeeCategory()` | `/fees/categories` | POST | Create fee category |
| `FeeService.assignFeeToStudent()` | `/fees/assign` | POST | Assign fee to student |
| `FeeService.createPayment()` | `/payments` | POST | Record payment |
| `FeeService.getFeeStats()` | `/fees/stats` | GET | Get fee statistics |

## Request/Response Format

### Standard Response Format
All API responses follow this structure:

```typescript
{
  success: boolean;
  message?: string;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Paginated Response Format
```typescript
{
  success: boolean;
  data: {
    items: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

## Authentication Flow

### 1. Login Process
```typescript
// Frontend sends
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Backend responds
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### 2. Token Storage
- Access token stored in `localStorage` as `token`
- Refresh token stored in `localStorage` as `refreshToken`
- User object stored in `localStorage` as `user`

### 3. Authenticated Requests
All authenticated requests include:
```
Authorization: Bearer <jwt_token>
```

### 4. Token Refresh
When token expires (401 error):
```typescript
// Frontend automatically sends
POST /api/v1/auth/refresh
{
  "refreshToken": "refresh_token_here"
}

// Backend responds with new tokens
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

### Frontend Error Handling
The frontend handles errors through:
1. **AuthInterceptor**: Catches 401 errors and triggers token refresh
2. **GlobalErrorHandler**: Catches all errors and displays user-friendly messages
3. **ErrorService**: Processes and formats error messages
4. **NotificationService**: Displays toast notifications

## Testing the Integration

### Step 1: Start Backend
```bash
cd /path/to/backend
npm run dev
```

Backend should be running on `http://localhost:3000`

### Step 2: Start Frontend
```bash
cd school-management-frontend
npm start
```

Frontend should be running on `http://localhost:4200`

### Step 3: Test Authentication
1. Navigate to `http://localhost:4200`
2. Should redirect to `/auth/login`
3. Try logging in with test credentials
4. Should redirect to dashboard on success

### Step 4: Test API Calls
Open browser DevTools (F12) and check:
- **Network Tab**: Verify API calls are being made
- **Console**: Check for any errors
- **Application Tab**: Verify tokens are stored in localStorage

## Common Integration Issues

### Issue 1: CORS Errors
**Symptom**: `Access-Control-Allow-Origin` error in console

**Solution**:
- Verify backend `.env` has `CORS_ORIGIN=http://localhost:4200`
- Restart backend server after changing `.env`

### Issue 2: 401 Unauthorized
**Symptom**: All API calls return 401

**Solution**:
- Check if token is stored in localStorage
- Verify token format in Authorization header
- Check if token has expired

### Issue 3: Connection Refused
**Symptom**: `ERR_CONNECTION_REFUSED` in console

**Solution**:
- Verify backend is running on port 3000
- Check firewall settings
- Verify API URL in `environment.ts`

### Issue 4: Timeout Errors
**Symptom**: Requests timeout after 30 seconds

**Solution**:
- Check database connection
- Verify backend is responding
- Check for slow queries

## API Service Implementation Status

### ✅ Fully Implemented Services
- **ApiService**: Base service with HTTP methods
- **AuthService**: Login, register, token management
- **StudentService**: Full CRUD operations
- **TeacherService**: Full CRUD operations
- **AcademicService**: Academic years and semesters
- **AttendanceService**: Attendance marking and reporting
- **FeeService**: Fee management and payments
- **GradeService**: Class/grade management

### ✅ Interceptors
- **AuthInterceptor**: Adds JWT token, handles 401 errors
- **LoadingInterceptor**: Tracks HTTP requests for loading state

### ✅ Guards
- **AuthGuard**: Protects routes requiring authentication
- **RoleGuard**: Protects routes based on user roles

## Data Flow Example

### Creating a Student

1. **User Action**: Admin clicks "Add Student" button
2. **Component**: Opens `StudentFormComponent` dialog
3. **Form Submission**: User fills form and clicks "Save"
4. **Service Call**: `StudentService.createStudent(studentData)`
5. **HTTP Request**: 
   ```
   POST /api/v1/students
   Authorization: Bearer <token>
   Content-Type: application/json
   
   { studentData }
   ```
6. **Backend Processing**: Validates, creates student in database
7. **HTTP Response**:
   ```json
   {
     "success": true,
     "data": { /* created student */ }
   }
   ```
8. **Frontend Handling**:
   - Service returns Observable
   - Component subscribes and handles response
   - Shows success notification
   - Closes dialog
   - Refreshes student list

## Performance Considerations

### Pagination
- All list endpoints support pagination
- Default page size: 10 items
- Frontend sends: `?page=1&limit=10`

### Caching
- Backend uses Redis for caching (if enabled)
- Frontend can implement client-side caching if needed

### Lazy Loading
- All feature modules are lazy-loaded
- Reduces initial bundle size
- Improves first load performance

## Security Considerations

### JWT Tokens
- Access token expires in 7 days (configurable)
- Refresh token used for obtaining new access tokens
- Tokens stored in localStorage (consider httpOnly cookies for production)

### HTTPS
- Use HTTPS in production
- Update `environment.prod.ts` with HTTPS URL

### Input Validation
- Frontend validates all form inputs
- Backend validates all incoming data
- Prevents XSS and injection attacks

## Monitoring and Debugging

### Frontend Debugging
```typescript
// Enable debug mode in environment
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  debug: true // Add this
};
```

### Backend Logging
- Check backend console for request logs
- Check `logs/` directory for error logs
- Use Sentry for production error tracking

### Network Monitoring
- Use browser DevTools Network tab
- Check request/response headers
- Verify payload structure
- Check response times

## Next Steps

1. ✅ Backend is running and configured
2. ✅ Frontend is configured to connect to backend
3. ✅ All services are implemented
4. ✅ Authentication flow is complete
5. ✅ Error handling is in place

### Ready for Testing
- Start both backend and frontend
- Test login flow
- Test CRUD operations for each module
- Verify role-based access control
- Test error scenarios

### Production Deployment
- Update `environment.prod.ts` with production API URL
- Enable HTTPS
- Configure production database
- Set up proper CORS origins
- Enable error tracking (Sentry)
- Set up monitoring and logging
