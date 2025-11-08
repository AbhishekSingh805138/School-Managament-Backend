import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { AuthService } from '../../../../services/auth.service';
import { TeacherService } from '../../../../services/teacher.service';
import { AttendanceService } from '../../../../services/attendance.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss'
})
export class TeacherDashboardComponent implements OnInit {
  isLoading = true;
  assignedClasses: any[] = [];
  todaySchedule: any[] = [];
  upcomingClasses: any[] = [];
  recentAttendance: any[] = [];

  quickActions = [
    { icon: 'how_to_reg', label: 'Mark Attendance', route: '/attendance/mark' },
    { icon: 'grade', label: 'Enter Grades', route: '/grades' },
    { icon: 'class', label: 'My Classes', route: '/classes' },
    { icon: 'schedule', label: 'My Schedule', route: '/schedule' }
  ];

  constructor(
    private authService: AuthService,
    private teacherService: TeacherService,
    private attendanceService: AttendanceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    const user = this.authService.getCurrentUserValue();
    
    if (!user) {
      this.isLoading = false;
      return;
    }

    // For now, just set loading to false
    // Full implementation will fetch teacher's classes, schedule, etc.
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getUserDisplayName(): string {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Teacher';
  }
}
