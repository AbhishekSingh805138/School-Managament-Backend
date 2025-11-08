# Frontend Design Document

## Overview

The School Management System Frontend is an Angular 19 application that provides a modern, responsive user interface for managing school operations. It follows Angular best practices with a modular architecture, lazy-loaded feature modules, and a clean separation of concerns.

### Technology Stack

- **Framework**: Angular 19.2
- **UI Library**: Angular Material 19.2
- **State Management**: RxJS 7.8 with Services
- **Charts**: Chart.js 4.5 with ng2-charts
- **Notifications**: ngx-toastr 19.1
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router with lazy loading
- **Forms**: Angular Reactive Forms
- **Styling**: SCSS with Angular Material theming

### Key Design Principles

1. **Modular Architecture**: Feature modules are lazy-loaded for optimal performance
2. **Reactive Programming**: RxJS observables for async operations and state management
3. **Type Safety**: TypeScript interfaces for all data models
4. **Reusability**: Shared components and services across modules
5. **Security**: JWT-based authentication with HTTP interceptors
6. **Responsiveness**: Mobile-first design with Angular Material
7. **Accessibility**: WCAG 2.1 AA compliance

## Architecture

### Application Structure

```
src/app/
├── components/          # Shared layout components
│   ├── header/
│   ├── sidebar/
│   ├── loading-spinner/
│   ├── not-found/
│   └── unauthorized/
├── guards/              # Route guards
│   └── auth.guard.ts
├── interceptors/        # HTTP interceptors
│   ├── auth.interceptor.ts
│   └── loading.interceptor.ts
├── models/              # TypeScript interfaces
│   ├── user.model.ts
│   ├── academic.model.ts
│   ├── student.model.ts
│   ├── teacher.model.ts
│   ├── attendance.model.ts
│   ├── fee.model.ts
│   └── grade.model.ts
├── modules/             # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── auth-layout/
│   │   ├── auth.module.ts
│   │   └── auth-routing.module.ts
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── admin-dashboard/
│   │   │   ├── teacher-dashboard/
│   │   │   ├── student-dashboard/
│   │   │   └── parent-dashboard/
│   │   ├── dashboard.module.ts
│   │   └── dashboard-routing.module.ts
│   ├── students/
│   │   ├── components/
│   │   │   ├── student-list/
│   │   │   ├── student-detail/
│   │   │   ├── student-form/
│   │   │   └── student-profile/
│   │   ├── students.module.ts
│   │   └── students-routing.module.ts
│   ├── teachers/
│   │   ├── components/
│   │   │   ├── teacher-list/
│   │   │   ├── teacher-detail/
│   │   │   └── teacher-form/
│   │   ├── teachers.module.ts
│   │   └── teachers-routing.module.ts
│   ├── classes/
│   │   ├── components/
│   │   │   ├── class-list/
│   │   │   ├── class-detail/
│   │   │   └── class-form/
│   │   ├── classes.module.ts
│   │   └── classes-routing.module.ts
│   ├── subjects/
│   │   ├── components/
│   │   │   ├── subject-list/
│   │   │   ├── subject-detail/
│   │   │   └── subject-form/
│   │   ├── subjects.module.ts
│   │   └── subjects-routing.module.ts
│   ├── attendance/
│   │   ├── components/
│   │   │   ├── attendance-mark/
│   │   │   ├── attendance-report/
│   │   │   └── attendance-calendar/
│   │   ├── attendance.module.ts
│   │   └── attendance-routing.module.ts
│   ├── fees/
│   │   ├── components/
│   │   │   ├── fee-category-list/
│   │   │   ├── fee-assignment/
│   │   │   ├── payment-form/
│   │   │   └── payment-history/
│   │   ├── fees.module.ts
│   │   └── fees-routing.module.ts
│   ├── academic/
│   │   ├── components/
│   │   │   ├── academic-year-list/
│   │   │   ├── academic-year-form/
│   │   │   ├── semester-list/
│   │   │   └── semester-form/
│   │   ├── academic.module.ts
│   │   └── academic-routing.module.ts
│   └── profile/
│       ├── components/
│       │   ├── profile-view/
│       │   ├── profile-edit/
│       │   └── change-password/
│       ├── profile.module.ts
│       └── profile-routing.module.ts
├── services/            # Core services
│   ├── api.service.ts
│   ├── auth.service.ts
│   ├── loading.service.ts
│   ├── student.service.ts
│   ├── teacher.service.ts
│   ├── academic.service.ts
│   ├── attendance.service.ts
│   ├── fee.service.ts
│   └── grade.service.ts
├── shared/              # Shared module
│   └── shared.module.ts
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

## Components and Interfaces

### Core Services

#### ApiService
Base service for HTTP communication with the backend API.

**Responsibilities:**
- Configure base URL and headers
- Handle HTTP requests (GET, POST, PUT, DELETE)
- Transform responses to typed models
- Handle HTTP errors

**Key Methods:**
```typescript
get<T>(endpoint: string, params?: any): Observable<T>
post<T>(endpoint: string, body: any): Observable<T>
put<T>(endpoint: string, body: any): Observable<T>
delete<T>(endpoint: string): Observable<T>
```

#### AuthService
Manages authentication state and operations.

**Responsibilities:**
- Handle login/logout operations
- Store and retrieve JWT tokens
- Manage user session
- Provide current user information
- Handle token refresh

**Key Methods:**
```typescript
login(email: string, password: string): Observable<AuthResponse>
register(userData: RegisterData): Observable<AuthResponse>
logout(): void
getCurrentUser(): Observable<User>
isAuthenticated(): boolean
getToken(): string | null
refreshToken(): Observable<AuthResponse>
```

**State:**
```typescript
private currentUserSubject: BehaviorSubject<User | null>
public currentUser$: Observable<User | null>
```

#### LoadingService
Manages global loading state.

**Responsibilities:**
- Track active HTTP requests
- Show/hide loading spinner
- Provide loading state observable

**Key Methods:**
```typescript
show(): void
hide(): void
isLoading$: Observable<boolean>
```

### Feature Services

#### StudentService
Manages student data operations.

**Key Methods:**
```typescript
getStudents(params?: QueryParams): Observable<PaginatedResponse<Student>>
getStudentById(id: string): Observable<Student>
createStudent(student: CreateStudentDto): Observable<Student>
updateStudent(id: string, student: UpdateStudentDto): Observable<Student>
deleteStudent(id: string): Observable<void>
assignToClass(studentId: string, classId: string): Observable<void>
```

#### TeacherService
Manages teacher data operations.

**Key Methods:**
```typescript
getTeachers(params?: QueryParams): Observable<Teacher[]>
getTeacherById(id: string): Observable<Teacher>
createTeacher(teacher: CreateTeacherDto): Observable<Teacher>
updateTeacher(id: string, teacher: UpdateTeacherDto): Observable<Teacher>
deleteTeacher(id: string): Observable<void>
getTeacherSchedule(id: string): Observable<Schedule[]>
```

#### AttendanceService
Manages attendance operations.

**Key Methods:**
```typescript
markAttendance(data: AttendanceData[]): Observable<void>
getAttendanceByClass(classId: string, date: Date): Observable<Attendance[]>
getAttendanceByStudent(studentId: string, dateRange: DateRange): Observable<Attendance[]>
getAttendanceReport(params: ReportParams): Observable<AttendanceReport>
exportAttendance(params: ExportParams): Observable<Blob>
```

#### FeeService
Manages fee and payment operations.

**Key Methods:**
```typescript
getFeeCategories(): Observable<FeeCategory[]>
createFeeCategory(category: CreateFeeCategoryDto): Observable<FeeCategory>
assignFee(data: FeeAssignmentDto): Observable<void>
getStudentFees(studentId: string): Observable<Fee[]>
recordPayment(payment: PaymentDto): Observable<Payment>
getPaymentHistory(studentId: string): Observable<Payment[]>
```

#### AcademicService
Manages academic years and semesters.

**Key Methods:**
```typescript
getAcademicYears(): Observable<AcademicYear[]>
createAcademicYear(year: CreateAcademicYearDto): Observable<AcademicYear>
getSemesters(academicYearId?: string): Observable<Semester[]>
createSemester(semester: CreateSemesterDto): Observable<Semester>
getCurrentSemester(): Observable<Semester>
```

### Guards

#### AuthGuard
Protects routes that require authentication.

**Logic:**
1. Check if user is authenticated
2. If authenticated, allow navigation
3. If not authenticated, redirect to login
4. Store intended URL for post-login redirect

#### RoleGuard
Protects routes based on user roles.

**Logic:**
1. Check if user has required role
2. If authorized, allow navigation
3. If not authorized, redirect to unauthorized page

### Interceptors

#### AuthInterceptor
Adds authentication token to outgoing requests.

**Logic:**
1. Intercept outgoing HTTP requests
2. Add Authorization header with JWT token
3. Handle 401 responses by redirecting to login
4. Attempt token refresh on 401 errors

#### LoadingInterceptor
Manages loading state for HTTP requests.

**Logic:**
1. Increment loading counter on request start
2. Show loading spinner if counter > 0
3. Decrement loading counter on request complete
4. Hide loading spinner if counter === 0

## Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'staff';
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Student Model
```typescript
interface Student {
  id: string;
  userId: string;
  user: User;
  studentId: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  enrollmentDate: Date;
  classId?: string;
  class?: Class;
  parentId?: string;
  parent?: Parent;
  guardianName?: string;
  guardianPhone?: string;
  medicalInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Teacher Model
```typescript
interface Teacher {
  id: string;
  userId: string;
  user: User;
  employeeId: string;
  dateOfJoining: Date;
  qualification: string;
  specialization: string;
  subjects?: Subject[];
  classes?: Class[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Class Model
```typescript
interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  academicYearId: string;
  academicYear: AcademicYear;
  classTeacherId?: string;
  classTeacher?: Teacher;
  capacity: number;
  students?: Student[];
  subjects?: Subject[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Attendance Model
```typescript
interface Attendance {
  id: string;
  studentId: string;
  student: Student;
  classId: string;
  class: Class;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  markedBy: string;
  markedByUser: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### Fee Model
```typescript
interface Fee {
  id: string;
  studentId: string;
  student: Student;
  categoryId: string;
  category: FeeCategory;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidAmount: number;
  payments?: Payment[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### Error Types

1. **Network Errors**: Connection failures, timeouts
2. **Authentication Errors**: Invalid credentials, expired tokens
3. **Authorization Errors**: Insufficient permissions
4. **Validation Errors**: Invalid form data
5. **Server Errors**: 500 errors from backend

### Error Handling Strategy

1. **HTTP Interceptor**: Catch all HTTP errors
2. **Error Service**: Centralized error processing
3. **Toast Notifications**: User-friendly error messages
4. **Form Validation**: Real-time validation feedback
5. **Retry Logic**: Automatic retry for transient failures

### Error Display

- **Toast Notifications**: For API errors and success messages
- **Inline Validation**: For form field errors
- **Error Pages**: For 404 and unauthorized access
- **Dialog Modals**: For critical errors requiring user action

## Testing Strategy

### Unit Testing

- **Services**: Test all service methods with mocked HTTP calls
- **Components**: Test component logic and template rendering
- **Guards**: Test authentication and authorization logic
- **Interceptors**: Test request/response modification
- **Pipes**: Test data transformation logic

**Tools**: Jasmine, Karma

### Integration Testing

- **User Flows**: Test complete user journeys
- **API Integration**: Test service integration with backend
- **Routing**: Test navigation and route guards
- **Forms**: Test form submission and validation

### E2E Testing

- **Critical Paths**: Login, student registration, attendance marking
- **Role-Based Access**: Test different user role scenarios
- **Responsive Design**: Test on different screen sizes

**Tools**: Protractor or Cypress (to be decided)

## Routing Structure

```typescript
const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module')
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard/dashboard.module'),
    canActivate: [AuthGuard]
  },
  {
    path: 'students',
    loadChildren: () => import('./modules/students/students.module'),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'teacher'] }
  },
  {
    path: 'teachers',
    loadChildren: () => import('./modules/teachers/teachers.module'),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'classes',
    loadChildren: () => import('./modules/classes/classes.module'),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'teacher'] }
  },
  {
    path: 'subjects',
    loadChildren: () => import('./modules/subjects/subjects.module'),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'attendance',
    loadChildren: () => import('./modules/attendance/attendance.module'),
    canActivate: [AuthGuard]
  },
  {
    path: 'fees',
    loadChildren: () => import('./modules/fees/fees.module'),
    canActivate: [AuthGuard]
  },
  {
    path: 'academic',
    loadChildren: () => import('./modules/academic/academic.module'),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'profile',
    loadChildren: () => import('./modules/profile/profile.module'),
    canActivate: [AuthGuard]
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', component: NotFoundComponent }
];
```

## UI/UX Design

### Layout Structure

**Main Layout** (for authenticated users):
- Header: Logo, user menu, notifications
- Sidebar: Navigation menu (collapsible on mobile)
- Content Area: Router outlet for feature modules
- Footer: Copyright, version info

**Auth Layout** (for login/register):
- Centered card with form
- School logo and branding
- Background image or gradient

### Component Patterns

#### List Components
- Data table with sorting and filtering
- Pagination controls
- Search bar
- Action buttons (create, edit, delete)
- Bulk actions (where applicable)

#### Form Components
- Reactive forms with validation
- Error messages below fields
- Submit and cancel buttons
- Loading state during submission
- Success/error notifications

#### Detail Components
- Card-based layout
- Tabs for different sections
- Action buttons (edit, delete)
- Related data sections

### Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Theme Configuration

**Primary Color**: Material Indigo
**Accent Color**: Material Pink
**Warn Color**: Material Red

Custom theme with school branding colors can be configured in `styles.scss`.

## Performance Optimization

1. **Lazy Loading**: All feature modules are lazy-loaded
2. **OnPush Change Detection**: Use for list components
3. **Virtual Scrolling**: For large lists (CDK Virtual Scroll)
4. **Image Optimization**: Lazy load images, use appropriate formats
5. **Bundle Optimization**: Tree shaking, code splitting
6. **Caching**: Cache API responses where appropriate
7. **Debouncing**: Debounce search inputs and API calls

## Security Considerations

1. **JWT Storage**: Store tokens in localStorage (consider httpOnly cookies for production)
2. **XSS Prevention**: Angular's built-in sanitization
3. **CSRF Protection**: Not needed for JWT-based auth
4. **Input Validation**: Client-side validation + server-side validation
5. **Role-Based Access**: Guards and route data
6. **Secure Communication**: HTTPS only in production
7. **Token Expiration**: Automatic token refresh
8. **Logout on Inactivity**: Optional timeout feature

## Accessibility

1. **Semantic HTML**: Use proper HTML5 elements
2. **ARIA Labels**: Add where needed for screen readers
3. **Keyboard Navigation**: All interactive elements accessible via keyboard
4. **Focus Management**: Proper focus indicators
5. **Color Contrast**: WCAG AA compliance
6. **Form Labels**: All form fields have associated labels
7. **Error Announcements**: Screen reader announcements for errors

## Deployment

### Build Configuration

**Development**:
```bash
ng serve
```

**Production**:
```bash
ng build --configuration production
```

### Environment Configuration

**environment.ts** (development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

**environment.prod.ts** (production):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.school.com/api/v1'
};
```

### Hosting Options

- **Static Hosting**: Netlify, Vercel, AWS S3 + CloudFront
- **Server Hosting**: Nginx, Apache
- **Container**: Docker with Nginx

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live notifications
2. **Offline Support**: Service workers and PWA features
3. **Mobile App**: Ionic or React Native wrapper
4. **Advanced Analytics**: More detailed charts and reports
5. **Messaging System**: Internal messaging between users
6. **Calendar Integration**: Google Calendar sync
7. **File Upload**: Document management for students
8. **Multi-language Support**: i18n implementation
