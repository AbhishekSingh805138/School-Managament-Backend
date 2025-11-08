import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../../services/auth.service';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { TeacherDashboardComponent } from '../teacher-dashboard/teacher-dashboard.component';
import { StudentDashboardComponent } from '../student-dashboard/student-dashboard.component';
import { ParentDashboardComponent } from '../parent-dashboard/parent-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AdminDashboardComponent,
    TeacherDashboardComponent,
    StudentDashboardComponent,
    ParentDashboardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Component will render the appropriate dashboard based on user role
  }

  isAdmin(): boolean {
    return this.authService.isAdmin() || this.authService.isStaff();
  }

  isTeacher(): boolean {
    return this.authService.isTeacher();
  }

  isStudent(): boolean {
    return this.authService.isStudent();
  }

  isParent(): boolean {
    return this.authService.isParent();
  }
}
