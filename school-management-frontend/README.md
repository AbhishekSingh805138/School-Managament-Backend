# School Management System - Frontend

A modern Angular frontend for the School Management System with a beautiful, professional UI.

## 🚀 Features

### ✅ Implemented
- **Modern Angular 17+** with standalone components
- **Responsive Design** that works on all devices
- **Authentication System** with login/register pages
- **Role-based Dashboard** with different views for Admin, Teacher, Student, Parent
- **Beautiful UI** with gradient backgrounds and modern styling
- **Routing System** with lazy-loaded modules
- **Professional Layout** with clean, intuitive design

### 🎯 Architecture
- **Standalone Components** - Modern Angular approach
- **Lazy Loading** - Optimized performance with route-based code splitting
- **Service Layer** - Complete API integration services
- **Type Safety** - Full TypeScript implementation
- **Modular Structure** - Organized by feature modules

## 🛠️ Tech Stack

- **Angular 17+** - Latest Angular framework
- **TypeScript** - Type-safe development
- **SCSS** - Advanced styling capabilities
- **RxJS** - Reactive programming
- **Angular Router** - Client-side routing
- **HTTP Client** - API integration

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # Shared components
│   │   ├── header/
│   │   ├── sidebar/
│   │   ├── loading-spinner/
│   │   ├── unauthorized/
│   │   └── not-found/
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication module
│   │   │   ├── components/
│   │   │   │   ├── auth-layout/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── auth-routing.module.ts
│   │   └── dashboard/      # Dashboard module
│   │       ├── components/
│   │       │   └── dashboard/
│   │       └── dashboard-routing.module.ts
│   ├── services/           # API services
│   │   ├── auth.service.ts
│   │   ├── api.service.ts
│   │   ├── student.service.ts
│   │   ├── teacher.service.ts
│   │   ├── attendance.service.ts
│   │   ├── fee.service.ts
│   │   ├── grade.service.ts
│   │   └── academic.service.ts
│   ├── models/             # TypeScript interfaces
│   │   ├── user.model.ts
│   │   ├── student.model.ts
│   │   ├── teacher.model.ts
│   │   ├── attendance.model.ts
│   │   ├── fee.model.ts
│   │   ├── grade.model.ts
│   │   └── academic.model.ts
│   ├── guards/             # Route guards
│   │   └── auth.guard.ts
│   ├── interceptors/       # HTTP interceptors
│   │   ├── auth.interceptor.ts
│   │   └── loading.interceptor.ts
│   └── shared/             # Shared module
│       └── shared.module.ts
└── styles.scss             # Global styles
```

## 🎨 UI Features

### Design System
- **Modern Gradient Backgrounds** - Beautiful color schemes
- **Card-based Layout** - Clean, organized content presentation
- **Responsive Grid System** - Works on all screen sizes
- **Professional Typography** - Inter font family
- **Consistent Spacing** - Harmonious layout system
- **Hover Effects** - Interactive elements with smooth transitions

### Dashboard Features
- **Role-based Content** - Different dashboards for each user type
- **Statistics Cards** - Key metrics display
- **Quick Actions** - Easy access to common tasks
- **Recent Activities** - Timeline of system events
- **Responsive Charts** - Data visualization (ready for integration)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Angular CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-management-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   ng serve
   ```

4. **Open browser**
   Navigate to `http://localhost:4200`

### Available Scripts

- `ng serve` - Start development server
- `ng build` - Build for production
- `ng test` - Run unit tests
- `ng lint` - Run linting
- `ng generate` - Generate new components/services

## 🔗 API Integration

The frontend is designed to integrate with the School Management System backend API:

- **Base URL**: `http://localhost:3000/api/v1`
- **Authentication**: JWT token-based
- **Services**: Complete API service layer implemented
- **Models**: TypeScript interfaces for all data models
- **Interceptors**: Automatic token handling and loading states

### API Endpoints Ready
- Authentication (login, register, profile)
- Student Management (CRUD, enrollment, reports)
- Teacher Management (profiles, assignments, schedules)
- Attendance (marking, reports, analytics)
- Fee Management (categories, payments, receipts)
- Grade Management (entry, calculations, report cards)
- Academic Structure (years, semesters, subjects, classes)

## 🎯 Current Status

### ✅ Completed
- Project setup and configuration
- Authentication module with login/register
- Dashboard module with statistics
- Complete service layer for API integration
- TypeScript models for all entities
- Routing and navigation
- Responsive design foundation
- Error handling components

### 🚧 Next Steps
- Implement full authentication flow with backend
- Add Angular Material components for forms
- Create detailed CRUD interfaces for all modules
- Add data visualization with charts
- Implement file upload functionality
- Add real-time notifications
- Create comprehensive admin panel
- Add mobile-responsive navigation

## 🎨 Screenshots

The application features:
- **Login Page**: Beautiful gradient background with clean form
- **Dashboard**: Modern card-based layout with statistics
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Professional Styling**: Clean, modern interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Angular 17+ and modern web technologies**