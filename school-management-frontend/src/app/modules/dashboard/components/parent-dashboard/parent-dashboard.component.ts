import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './parent-dashboard.component.html',
  styleUrl: './parent-dashboard.component.scss'
})
export class ParentDashboardComponent implements OnInit {
  isLoading = true;
  children: any[] = [];
  selectedChildId: string = '';

  quickActions = [
    { icon: 'how_to_reg', label: 'View Attendance', route: '/attendance/child' },
    { icon: 'payment', label: 'View Fees', route: '/fees/child' },
    { icon: 'grade', label: 'View Grades', route: '/grades/child' },
    { icon: 'person', label: 'My Profile', route: '/profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadChildren();
  }

  loadChildren() {
    this.isLoading = true;
    // For now, just set loading to false
    // Full implementation will fetch parent's children
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  onChildChange() {
    // Load selected child's data
    console.log('Selected child:', this.selectedChildId);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getUserDisplayName(): string {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Parent';
  }
}
