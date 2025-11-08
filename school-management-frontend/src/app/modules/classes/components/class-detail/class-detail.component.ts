import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';

import { GradeService } from '../../../../services/grade.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './class-detail.component.html',
  styleUrl: './class-detail.component.scss'
})
export class ClassDetailComponent implements OnInit {
  classId: string = '';
  classData: any = null;
  students: any[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gradeService: GradeService,
    private notificationService: NotificationService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.classId = this.route.snapshot.paramMap.get('id') || '';
    if (this.classId) {
      this.loadClassDetails();
    } else {
      this.error = 'Invalid class ID';
    }
  }

  loadClassDetails() {
    this.isLoading = true;
    this.error = null;

    this.gradeService.getGrade(this.classId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.classData = response.data;
          this.loadStudents();
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = this.errorService.processError(error);
        this.error = errorMessage.message;
        this.notificationService.error('Failed to load class details', 'Error');
        this.errorService.logError(error, 'ClassDetail.loadClassDetails');
      }
    });
  }

  loadStudents() {
    if (!this.classId) return;

    this.gradeService.getGradeStudents(this.classId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.students = response.data;
        }
      },
      error: (error) => {
        this.errorService.logError(error, 'ClassDetail.loadStudents');
      }
    });
  }

  goBack() {
    this.router.navigate(['/classes']);
  }

  editClass() {
    this.notificationService.info('Edit functionality coming soon!');
  }

  deleteClass() {
    if (confirm(`Are you sure you want to delete this class?`)) {
      this.gradeService.deleteGrade(this.classId).subscribe({
        next: () => {
          this.notificationService.success('Class deleted successfully');
          this.router.navigate(['/classes']);
        },
        error: (error) => {
          const errorMessage = this.errorService.processError(error);
          this.notificationService.error(errorMessage.message, 'Delete Failed');
          this.errorService.logError(error, 'ClassDetail.deleteClass');
        }
      });
    }
  }

  retry() {
    this.loadClassDetails();
  }
}
