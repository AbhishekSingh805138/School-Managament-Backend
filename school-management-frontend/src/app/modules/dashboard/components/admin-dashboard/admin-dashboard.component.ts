import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { StudentService } from '../../../../services/student.service';
import { TeacherService } from '../../../../services/teacher.service';
import { AttendanceService } from '../../../../services/attendance.service';
import { FeeService } from '../../../../services/fee.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/auth.service';

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
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
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
    { icon: 'person_add', label: 'Add Student', route: '/students/add' },
    { icon: 'how_to_reg', label: 'Mark Attendance', route: '/attendance/mark' },
    { icon: 'payment', label: 'Record Payment', route: '/fees/payments' },
    { icon: 'assessment', label: 'View Reports', route: '/reports' }
  ];

  constructor(
    private studentService: StudentService,
    private teacherService: TeacherService,
    private attendanceService: AttendanceService,
    private feeService: FeeService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    let loadedCount = 0;
    const totalLoads = 4;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= totalLoads) {
        this.isLoading = false;
      }
    };

    // Load student stats
    this.studentService.getStudentStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.totalStudents = response.data.total || 0;
        }
        checkComplete();
      },
      error: (error) => {
        console.error('Error loading student stats:', error);
        checkComplete();
      }
    });

    // Load teacher stats
    this.teacherService.getTeacherStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.totalTeachers = response.data.total || 0;
        }
        checkComplete();
      },
      error: (error) => {
        console.error('Error loading teacher stats:', error);
        checkComplete();
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
        checkComplete();
      },
      error: (error) => {
        console.error('Error loading attendance stats:', error);
        checkComplete();
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
        checkComplete();
      },
      error: (error) => {
        console.error('Error loading fee stats:', error);
        checkComplete();
      }
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getUserDisplayName(): string {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Admin';
  }
}
