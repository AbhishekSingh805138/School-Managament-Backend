import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'academic-years',
    pathMatch: 'full'
  },
  {
    path: 'academic-years',
    loadComponent: () => import('./components/academic-year-list/academic-year-list.component').then(m => m.AcademicYearListComponent)
  },
  {
    path: 'semesters',
    loadComponent: () => import('./components/semester-list/semester-list.component').then(m => m.SemesterListComponent)
  }
];
