import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { Router } from '@angular/router';

import { AuthService } from '../../../../services/auth.service';
import { StudentService } from '../../../../services/student.service';
import { TeacherService } from '../../../../services/teacher.service';
import { AttendanceService } from '../../../../services/attendance.service';
import { FeeService } from '../../../../services/fee.service';
import { NotificationService } from '../../../../services/notification.service';
import { User } from '../../../../models/user.model';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todayAttendance: {
    present: number;
    absent: number;
    total: number;
    percentage: number;
  };
  feeCollection: {
    collected: number;
    pending: number;
    total: number;
    percentage: number;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatGridListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  stats: DashboardStats = {
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: {
      present: 0,
      absent: 0,
      total: 0,
      percentage: 0
    },
    feeCollection: {
      collected: 0,
      pending: 0,
      total: 0,
      percentage: 0
    }
  };

  quickActions = [
    { icon: 'person_add', label: 'Add Student', route: '/students/add', roles: ['admin', 'staff'] },
    { icon: 'how_to_reg', label: 'Mark Attendance', route: '/attendance/mark', roles: ['admin', 'teacher', 'staff'] },
    { icon: 'payment', label: 'Record Payment', route: '/fees/payments', roles: ['admin', 'staff'] },
    { icon: 'assessment', label: 'View Reports', route: '/reports', roles: ['admin', 'teacher', 'staff'] }
  ];

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private attendanceService: AttendanceService,
    private feeService: FeeService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUserValue();
    
    if (this.currentUser) {
      this.loadDashboardData();
    }
  }

  loadDashboardData() {
    this.isLoading = true;

    // Load different data based on user role
    if (this.isAdmin() || this.isStaff()) {
      this.loadAdminDashboard();
    } else if (this.isTeacher()) {
      this.loadTeacherDashboard();
    } else if (this.isStudent()) {
      this.loadStudentDashboard();
    } else if (this.isParent()) {
      this.loadParentDashboard();
    }
  }

  loadAdminDashboard() {
    // Load student stats
    this.studentService.getStudentStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.totalStudents = response.data.total || 0;
        }
      },
      error: (error) => {
        console.error('Error loading student stats:', error);
      }
    });

    // Load teacher stats
    this.teacherService.getTeacherStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.totalTeachers = response.data.total || 0;
        }
      },
      error: (error) => {
        console.error('Error loading teacher stats:', error);
      }
    });

    // Load attendance stats
    const today = new Date().toISOString().split('T')[0];
    this.attendanceService.getAttendanceStats({ date: today }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.todayAttendance = {
            present: response.data.present || 0,
            absent: response.data.absent || 0,
            total: response.data.total || 0,
            percentage: response.data.percentage || 0
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading attendance stats:', error);
        this.isLoading = false;
      }
    });

    // Load fee stats
    this.feeService.getFeeStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.feeCollection = {
            collected: response.data.collected || 0,
            pending: response.data.pending || 0,
            total: response.data.total || 0,
            percentage: response.data.collectionPercentage || 0
          };
        }
      },
      error: (error) => {
        console.error('Error loading fee stats:', error);
      }
    });
  }

  loadTeacherDashboard() {
    // Teacher-specific dashboard will be implemented separately
    this.isLoading = false;
    this.notificationService.info('Teacher dashboard coming soon!');
  }

  loadStudentDashboard() {
    // Student-specific dashboard will be implemented separately
    this.isLoading = false;
    this.notificationService.info('Student dashboard coming soon!');
  }

  loadParentDashboard() {
    // Parent-specific dashboard will be implemented separately
    this.isLoading = false;
    this.notificationService.info('Parent dashboard coming soon!');
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  hasAccess(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
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

  isStaff(): boolean {
    return this.authService.isStaff();
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'User';
  }

  getUserRole(): string {
    if (!this.currentUser?.role) return '';
    return this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
  }
}
