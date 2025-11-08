import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeacherListComponent } from './components/teacher-list/teacher-list.component';
import { TeacherDetailComponent } from './components/teacher-detail/teacher-detail.component';

const routes: Routes = [
  {
    path: '',
    component: TeacherListComponent
  },
  {
    path: ':id',
    component: TeacherDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeachersRoutingModule { }
