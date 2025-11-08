import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'academic',
    loadChildren: () => import('./modules/academic/academic.module').then(m => m.AcademicModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'students',
    loadChildren: () => import('./modules/students/students.module').then(m => m.StudentsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'teachers',
    loadChildren: () => import('./modules/teachers/teachers.module').then(m => m.TeachersModule),
    canActivate: [AuthGuard]
  },
  // Temporarily disabled until components are fully implemented
  // {
  //   path: 'classes',
  //   loadChildren: () => import('./modules/classes/classes.module').then(m => m.ClassesModule),
  //   canActivate: [AuthGuard]
  // },
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/unauthorized/unauthorized.component').then(c => c.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
