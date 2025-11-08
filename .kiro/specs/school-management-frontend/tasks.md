# Implementation Plan

## Current Status

The following infrastructure has been completed:
- ✅ All core services (Auth, API, Student, Teacher, Attendance, Fee, Academic, Grade, Loading, Error)
- ✅ All data models and TypeScript interfaces
- ✅ Shared module with Angular Material components, pipes, and directives
- ✅ Reusable form components (form-field, form-select, form-datepicker)
- ✅ Core layout components (header, sidebar, loading-spinner, not-found, unauthorized)
- ✅ Auth guards (AuthGuard, RoleGuard) and interceptors (AuthInterceptor, LoadingInterceptor)
- ✅ Environment configuration files
- ✅ Auth module structure (login, register, auth-layout components exist but need implementation)
- ✅ Dashboard module structure (basic component exists but needs implementation)

## What Needs to Be Done

The main work remaining is:
1. Configure app.config.ts to register interceptors and providers
2. Update app.component to include the main layout (header + sidebar + content)
3. Implement the auth UI components (login, register forms with validation)
4. Implement dashboard components for each role (admin, teacher, student, parent)
5. Create feature modules (students, teachers, classes, subjects, attendance, fees, academic, profile)
6. Implement all feature components with forms, lists, and detail views
7. Wire all modules into the main routing configuration
8. Configure ngx-toastr for notifications
9. Add responsive design and accessibility features
10. End-to-end testing and optimization

- [ ] 0. Configure application providers and interceptors
  - Register HTTP interceptors in app.config.ts
  - Configure ngx-toastr in app.config.ts
  - Set up Angular Material theme
  - Configure app component with main layout structure
  - _Requirements: 1.1, 18.1, 19.4_

- [ ] 0.1 Register interceptors and providers
  - Add AuthInterceptor to HTTP interceptor chain
  - Add LoadingInterceptor to HTTP interceptor chain
  - Configure provideAnimations for Angular Material
  - Import and configure ToastrModule
  - _Requirements: 1.2, 18.1, 19.4_

- [ ] 0.2 Set up main application layout
  - Update app.component to include header, sidebar, and content area
  - Add Material sidenav container for responsive layout
  - Integrate loading spinner component
  - Add router outlet within content area
  - Handle sidenav toggle for mobile
  - _Requirements: 3.1, 3.3, 18.3, 20.4_

- [x] 1. Complete core infrastructure and shared components
  - Set up environment configuration for API endpoints
  - Complete the shared module with common Angular Material components
  - Implement error handling service for centralized error management
  - Create reusable form components and validators
  - _Requirements: 1.1, 18.1, 19.1_

- [x] 1.1 Configure environment files and API base URL
  - Update environment.ts and environment.prod.ts with correct API URLs
  - Configure API versioning and timeout settings
  - _Requirements: 1.1_

- [x] 1.2 Complete shared module with Material components
  - Import and export commonly used Angular Material modules
  - Create shared pipes for date formatting, currency, etc.
  - Create shared directives for common behaviors
  - _Requirements: 18.1, 20.1_

- [x] 1.3 Implement error handling service
  - Create ErrorService to process and format errors
  - Implement error logging mechanism
  - Create user-friendly error message mappings
  - _Requirements: 19.1, 19.2_

- [x] 1.4 Create reusable form components
  - Build input field wrapper component with validation display
  - Build select dropdown wrapper component
  - Build date picker wrapper component
  - _Requirements: 19.3_

- [x] 2. Implement authentication system
  - Complete AuthService with login, register, and token management
  - Implement AuthGuard for route protection
  - Create RoleGuard for role-based access control
  - Complete AuthInterceptor for adding tokens to requests
  - Implement token refresh mechanism
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 23.1, 23.2, 23.3_

- [x] 2.1 Complete AuthService implementation
  - Implement login method with API integration
  - Implement register method with API integration
  - Implement logout with token cleanup
  - Create getCurrentUser method with BehaviorSubject
  - Implement token storage and retrieval from localStorage
  - Add token expiration checking
  - _Requirements: 1.2, 1.3, 23.1, 23.2_

- [x] 2.2 Implement AuthGuard
  - Check authentication status before route activation
  - Redirect to login if not authenticated
  - Store intended URL for post-login redirect
  - _Requirements: 1.1, 23.2_

- [x] 2.3 Create RoleGuard
  - Check user role against route requirements
  - Redirect to unauthorized page if insufficient permissions
  - Handle multiple role requirements
  - _Requirements: 3.2_

- [x] 2.4 Complete AuthInterceptor
  - Add Authorization header with JWT token to all requests
  - Handle 401 responses by redirecting to login
  - Implement token refresh on 401 errors
  - Skip interceptor for auth endpoints
  - _Requirements: 1.2, 23.3_

- [ ] 2.5 Implement automatic token refresh
  - Check token expiration before requests
  - Refresh token if expiring within 5 minutes
  - Queue requests during token refresh
  - _Requirements: 23.5_

- [ ] 3. Complete authentication UI components
  - Finish login component with form validation
  - Finish register component with form validation
  - Style auth layout with school branding
  - Add loading states and error handling
  - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [ ] 3.1 Complete login component
  - Build reactive form with email and password fields
  - Add form validation (required, email format)
  - Implement login submission with AuthService
  - Display error messages for invalid credentials
  - Redirect to dashboard on successful login
  - Add "Remember me" checkbox functionality
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 3.2 Complete register component
  - Build reactive form with all required fields
  - Add form validation (email, password strength, required fields)
  - Implement role selection dropdown
  - Implement registration submission with AuthService
  - Display success message and redirect to login
  - Handle duplicate email errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3.3 Style auth layout component
  - Create centered card layout for forms
  - Add school logo and branding
  - Implement responsive design for mobile
  - Add background styling
  - _Requirements: 20.1, 20.2, 20.3_

- [x] 4. Implement core layout components
  - Complete header component with user menu
  - Complete sidebar component with navigation
  - Implement responsive sidebar collapse for mobile
  - Add role-based menu item visibility
  - Create loading spinner component
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 18.3, 20.4_

- [x] 4.1 Complete header component
  - Display school logo and name
  - Create user menu dropdown with profile and logout
  - Add notifications icon (placeholder for future)
  - Implement logout functionality
  - Make header responsive for mobile
  - _Requirements: 3.5_

- [x] 4.2 Complete sidebar component
  - Create navigation menu with Material icons
  - Implement role-based menu item filtering
  - Add active route highlighting
  - Implement collapsible sidebar for mobile
  - Add hamburger menu toggle button
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 20.4_

- [x] 4.3 Implement loading spinner component
  - Create global loading spinner overlay
  - Integrate with LoadingService
  - Add smooth fade in/out animations
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 5. Implement dashboard module
  - Create admin dashboard with statistics
  - Create teacher dashboard with schedule
  - Create student dashboard with personal info
  - Create parent dashboard with children selector
  - Implement dashboard routing and role-based display
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 22.1, 22.2, 22.3, 22.4, 22.5, 17.1, 17.2_

- [ ] 5.1 Create admin dashboard component
  - Display total student count card
  - Display total teacher count card
  - Display today's attendance statistics card
  - Display fee collection statistics card
  - Implement Chart.js charts for trends
  - Fetch dashboard data from API
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ] 5.2 Create teacher dashboard component
  - Display assigned classes list
  - Display today's teaching schedule
  - Display upcoming classes
  - Display recent attendance records
  - Add quick action buttons for common tasks
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 5.3 Create student dashboard component
  - Display personal information card
  - Display attendance summary
  - Display fee status
  - Display upcoming events (placeholder)
  - _Requirements: 15.1, 15.3, 16.1, 16.2_

- [ ] 5.4 Create parent dashboard component
  - Display list of children
  - Implement child selector dropdown
  - Display selected child's dashboard
  - Show attendance, fees, and grades for selected child
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 5.5 Implement dashboard routing
  - Route to appropriate dashboard based on user role
  - Add guards to protect dashboard routes
  - _Requirements: 3.2_

- [ ] 6. Implement academic module
  - Create academic module and routing
  - Create academic year list component
  - Create academic year form component
  - Create semester list component
  - Create semester form component
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.1 Implement AcademicService
  - Create methods for academic year CRUD operations
  - Create methods for semester CRUD operations
  - Add method to get current semester
  - Implement error handling
  - _Requirements: 4.1, 5.1_

- [ ] 6.2 Create academic year list component
  - Display academic years in a Material table
  - Add create button to open form dialog
  - Add edit and delete actions for each row
  - Implement delete confirmation dialog
  - _Requirements: 4.1, 4.5_

- [ ] 6.3 Create academic year form component
  - Build reactive form with name, start date, end date
  - Add form validation
  - Implement create and update functionality
  - Display in Material dialog
  - _Requirements: 4.2, 4.3, 4.4_

- [ ] 6.4 Create semester list component
  - Display semesters in a Material table
  - Add filter by academic year dropdown
  - Add create button to open form dialog
  - Add edit and delete actions
  - Display dates in user-friendly format
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 6.5 Create semester form component
  - Build reactive form with name, academic year, start/end dates
  - Add form validation
  - Implement create and update functionality
  - Display in Material dialog
  - _Requirements: 5.3, 5.4_

- [ ] 7. Implement students module
  - Create students module and routing
  - Create student list component with pagination
  - Create student detail component
  - Create student form component
  - Create student profile component
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 Implement StudentService
  - Create methods for student CRUD operations
  - Implement pagination support
  - Add search functionality
  - Add method to assign student to class
  - Implement error handling
  - _Requirements: 6.1, 6.2_

- [ ] 7.2 Create student list component
  - Display students in paginated Material table
  - Add search bar for name, email, student ID
  - Add pagination controls
  - Add create button to navigate to form
  - Add view and edit actions for each row
  - Implement responsive table for mobile
  - _Requirements: 6.1, 6.2, 20.5_

- [ ] 7.3 Create student detail component
  - Display student information in cards
  - Show personal details, contact info, academic info
  - Display assigned class
  - Add edit and delete buttons
  - Show related data (attendance summary, fee status)
  - _Requirements: 6.3_

- [ ] 7.4 Create student form component
  - Build reactive form with all student fields
  - Add form validation for required fields
  - Implement date picker for date of birth
  - Add class assignment dropdown
  - Implement create and update functionality
  - _Requirements: 6.4, 6.5_

- [ ] 7.5 Create student profile component (for student role)
  - Display student's own information
  - Prevent editing of core fields
  - Allow updating contact information
  - _Requirements: 24.1, 24.2_

- [ ] 8. Implement teachers module
  - Create teachers module and routing
  - Create teacher list component
  - Create teacher detail component
  - Create teacher form component
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.1 Implement TeacherService
  - Create methods for teacher CRUD operations
  - Add method to get teacher schedule
  - Implement error handling
  - _Requirements: 7.1_

- [ ] 8.2 Create teacher list component
  - Display teachers in Material table
  - Show specialization and assigned subjects
  - Add create button to navigate to form
  - Add view and edit actions
  - _Requirements: 7.1, 7.2_

- [ ] 8.3 Create teacher detail component
  - Display teacher information in cards
  - Show qualifications and specialization
  - Display assigned subjects and classes
  - Show teaching schedule
  - Add edit and delete buttons
  - _Requirements: 7.5_

- [ ] 8.4 Create teacher form component
  - Build reactive form with teacher fields
  - Add qualification and specialization fields
  - Add date picker for joining date
  - Implement create and update functionality
  - _Requirements: 7.3, 7.4_

- [ ] 9. Implement classes module
  - Create classes module and routing
  - Create class list component
  - Create class detail component
  - Create class form component
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9.1 Implement GradeService (ClassService)
  - Create methods for class CRUD operations
  - Add method to get class students
  - Add method to assign subjects to class
  - Implement error handling
  - _Requirements: 8.1_

- [ ] 9.2 Create class list component
  - Display classes in Material table
  - Add filter by grade level dropdown
  - Show student count for each class
  - Add create button to navigate to form
  - Add view and edit actions
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 9.3 Create class detail component
  - Display class information
  - Show class teacher
  - Display list of enrolled students
  - Display assigned subjects
  - Add edit button
  - _Requirements: 8.5_

- [ ] 9.4 Create class form component
  - Build reactive form with class fields
  - Add grade and section dropdowns
  - Add class teacher selection
  - Add capacity field
  - Implement create and update functionality
  - _Requirements: 8.3_

- [ ] 10. Implement subjects module
  - Create subjects module and routing
  - Create subject list component
  - Create subject detail component
  - Create subject form component
  - Add subject assignment to classes
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10.1 Create subject list component
  - Display subjects in Material table
  - Add create button to navigate to form
  - Add edit and delete actions
  - _Requirements: 9.1_

- [ ] 10.2 Create subject form component
  - Build reactive form with subject fields
  - Add subject code field with uniqueness validation
  - Add description field
  - Implement create and update functionality
  - _Requirements: 9.2, 9.5_

- [ ] 10.3 Create subject detail component
  - Display subject information
  - Show assigned classes
  - Show assigned teachers
  - Add edit button
  - _Requirements: 9.3, 9.4_

- [ ] 11. Implement attendance module
  - Create attendance module and routing
  - Create attendance marking component
  - Create attendance report component
  - Create attendance calendar component
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5, 15.1, 15.2, 15.3, 15.4_

- [x] 11.1 Implement AttendanceService
  - Create method to mark attendance
  - Create method to get attendance by class
  - Create method to get attendance by student
  - Create method to get attendance reports
  - Add method to export attendance to CSV
  - _Requirements: 10.2, 11.1_

- [ ] 11.2 Create attendance marking component
  - Display class selector dropdown
  - Display date picker (default to today)
  - Show list of students in selected class
  - Add radio buttons for present/absent/late/excused
  - Add remarks field for each student
  - Implement bulk actions (mark all present)
  - Prevent marking future dates
  - Implement submit functionality
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11.3 Create attendance report component
  - Add filters for class, student, date range
  - Display attendance statistics table
  - Show attendance percentage for each student
  - Highlight students with low attendance (< 75%)
  - Add export to CSV button
  - Implement Chart.js visualization
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 11.4 Create attendance calendar component
  - Display calendar view of attendance
  - Color-code days by attendance status
  - Allow clicking days to see details
  - _Requirements: 15.2_

- [ ] 11.5 Create student attendance view
  - Display student's own attendance records
  - Show attendance by subject and date
  - Display attendance percentage
  - Add date range filter
  - Prevent viewing other students' data
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 12. Implement fees module
  - Create fees module and routing
  - Create fee category list component
  - Create fee category form component
  - Create fee assignment component
  - Create payment form component
  - Create payment history component
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 16.1, 16.2, 16.3, 16.4_

- [x] 12.1 Implement FeeService
  - Create methods for fee category CRUD
  - Create method to assign fees to students
  - Create method to record payments
  - Create method to get student fees
  - Create method to get payment history
  - _Requirements: 12.1, 13.1, 14.1_

- [ ] 12.2 Create fee category list component
  - Display fee categories in Material table
  - Add create button to open form dialog
  - Add edit and delete actions
  - Prevent deleting categories in use
  - _Requirements: 12.1, 12.5_

- [ ] 12.3 Create fee category form component
  - Build reactive form with name and default amount
  - Add form validation for unique name
  - Implement create and update functionality
  - Display in Material dialog
  - _Requirements: 12.2, 12.3, 12.4_

- [ ] 12.4 Create fee assignment component
  - Add student selector (single or multiple)
  - Display fee category dropdown
  - Add amount and due date fields
  - Implement bulk assignment functionality
  - Display total fees for selected students
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 12.5 Create payment form component
  - Display pending fees for selected student
  - Add payment amount field
  - Allow partial payments
  - Add payment method dropdown
  - Generate payment receipt on success
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 12.6 Create payment history component
  - Display payment history table
  - Show payment date, amount, method
  - Add filter by student
  - Add date range filter
  - _Requirements: 14.5_

- [ ] 12.7 Create student fee view
  - Display student's assigned fees
  - Show paid and pending amounts
  - Display payment history
  - Show due dates for pending fees
  - Prevent viewing other students' fees
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 13. Implement profile module
  - Create profile module and routing
  - Create profile view component
  - Create profile edit component
  - Create change password component
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 25.1, 25.2, 25.3, 25.4, 25.5_

- [ ] 13.1 Create profile view component
  - Display current user information
  - Show name, email, phone, address
  - Add edit button to navigate to edit form
  - Add change password button
  - _Requirements: 24.1_

- [ ] 13.2 Create profile edit component
  - Build reactive form with editable fields
  - Allow editing name, phone, address
  - Prevent editing email and role
  - Implement update functionality
  - Display success message on update
  - _Requirements: 24.2, 24.3, 24.4, 24.5_

- [ ] 13.3 Create change password component
  - Build reactive form with current and new password
  - Add password strength validation
  - Require current password for verification
  - Implement password change functionality
  - Log out user after successful change
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

- [ ] 14. Implement loading and error handling
  - Complete LoadingInterceptor
  - Integrate LoadingService with components
  - Configure ngx-toastr for notifications
  - Implement global error handler
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 14.1 Complete LoadingInterceptor
  - Increment counter on request start
  - Decrement counter on request complete
  - Update LoadingService state
  - Handle request errors
  - _Requirements: 18.1, 18.2_

- [ ] 14.2 Integrate LoadingService
  - Subscribe to loading state in app component
  - Show/hide global loading spinner
  - Add loading states to individual components
  - _Requirements: 18.3, 18.4_

- [ ] 14.3 Configure ngx-toastr
  - Set up toastr module in app config
  - Configure toast position and timeout
  - Create toast service wrapper
  - _Requirements: 19.4_

- [ ] 14.4 Implement global error handler
  - Create ErrorHandler service
  - Catch and process HTTP errors
  - Display user-friendly error messages
  - Handle different error types (network, auth, validation, server)
  - Log errors for debugging
  - _Requirements: 19.1, 19.2, 19.5_

- [ ] 15. Implement responsive design and accessibility
  - Apply responsive breakpoints to all components
  - Implement mobile-friendly navigation
  - Add ARIA labels and semantic HTML
  - Test keyboard navigation
  - Ensure color contrast compliance
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 15.1 Apply responsive design
  - Update all components to use responsive CSS
  - Test on mobile, tablet, and desktop breakpoints
  - Implement responsive tables with horizontal scroll
  - Adjust form layouts for mobile
  - _Requirements: 20.1, 20.2, 20.3, 20.5_

- [ ] 15.2 Implement mobile navigation
  - Convert sidebar to hamburger menu on mobile
  - Add slide-in animation for mobile menu
  - Ensure touch-friendly button sizes
  - _Requirements: 20.4_

- [ ] 15.3 Add accessibility features
  - Add ARIA labels to interactive elements
  - Use semantic HTML elements
  - Ensure all forms have proper labels
  - Add focus indicators
  - Test with screen reader
  - Verify color contrast ratios
  - _Requirements: Accessibility compliance_

- [ ] 16. Wire everything together and final testing
  - Connect all modules to main routing
  - Test all user flows end-to-end
  - Verify role-based access control
  - Test error scenarios
  - Optimize bundle size
  - _Requirements: All requirements_

- [ ] 16.1 Connect all modules to app routing
  - Add lazy-loaded routes for students module
  - Add lazy-loaded routes for teachers module
  - Add lazy-loaded routes for classes module
  - Add lazy-loaded routes for subjects module
  - Add lazy-loaded routes for attendance module
  - Add lazy-loaded routes for fees module
  - Add lazy-loaded routes for academic module
  - Add lazy-loaded routes for profile module
  - Apply AuthGuard and RoleGuard to protected routes
  - _Requirements: 3.3_

- [ ] 16.2 End-to-end testing
  - Test admin user flow (login, manage students, mark attendance, etc.)
  - Test teacher user flow (login, view classes, mark attendance, etc.)
  - Test student user flow (login, view attendance, view fees, etc.)
  - Test parent user flow (login, view children, switch between children, etc.)
  - _Requirements: All requirements_

- [ ] 16.3 Test error scenarios
  - Test network failures
  - Test invalid credentials
  - Test unauthorized access attempts
  - Test form validation errors
  - Test API errors
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 16.4 Performance optimization
  - Analyze bundle size with webpack-bundle-analyzer
  - Implement OnPush change detection where applicable
  - Optimize images and assets
  - Test loading performance
  - _Requirements: Performance goals_

- [ ] 16.5 Write unit tests for critical components
  - Write tests for AuthService
  - Write tests for guards and interceptors
  - Write tests for form validation logic
  - _Requirements: Testing strategy_
