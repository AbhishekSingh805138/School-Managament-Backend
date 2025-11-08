import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcademicYearListComponent } from './components/academic-year-list/academic-year-list.component';
import { SemesterListComponent } from './components/semester-list/semester-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'academic-years',
    pathMatch: 'full'
  },
  {
    path: 'academic-years',
    component: AcademicYearListComponent
  },
  {
    path: 'semesters',
    component: SemesterListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcademicRoutingModule { }
