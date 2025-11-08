import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  isLoading = true;

  quickActions = [
    { icon: 'how_to_reg', label: 'My Attendance', route: '/attendance/my' },
    { icon: 'payment', label: 'My Fees', route: '/fees/my' },
    { icon: 'grade', label: 'My Grades', route: '/grades/my' },
    { icon: 'person', label: 'My Profile', route: '/profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
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
    return 'Student';
  }
}
