import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GradeService } from '../../../../services/grade.service';
import { NotificationService } from '../../../../services/notification.service';
import { ErrorService } from '../../../../services/error.service';

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  studentCount?: number;
  classTeacher?: {
    firstName: string;
    lastName: string;
  };
}

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './class-list.component.html',
  styleUrl: './class-list.component.scss'
})
export class ClassListComponent implements OnInit {
  classes: Class[] = [];
  displayedColumns: string[] = ['name', 'grade', 'section', 'capacity', 'studentCount', 'teacher', 'actions'];
  isLoading = false;
  error: string | null = null;

  constructor(
    private gradeService: GradeService,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadClasses();
  }

  loadClasses() {
    this.isLoading = true;
    this.error = null;

    this.gradeService.getGrades().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.classes = response.data.items || response.data;
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = this.errorService.processError(error);
        this.error = errorMessage.message;
        this.notificationService.error('Failed to load classes. Please try again.', 'Error');
        this.errorService.logError(error, 'ClassList.loadClasses');
      }
    });
  }

  viewClass(classItem: Class) {
    this.router.navigate(['/classes', classItem.id]);
  }

  editClass(classItem: Class) {
    this.notificationService.info('Edit functionality coming soon!');
  }

  deleteClass(classItem: Class) {
    if (confirm(`Are you sure you want to delete ${classItem.name}?`)) {
      this.gradeService.deleteGrade(classItem.id).subscribe({
        next: () => {
          this.notificationService.success('Class deleted successfully');
          this.loadClasses();
        },
        error: (error) => {
          const errorMessage = this.errorService.processError(error);
          this.notificationService.error(errorMessage.message, 'Delete Failed');
          this.errorService.logError(error, 'ClassList.deleteClass');
        }
      });
    }
  }

  getTeacherName(classItem: Class): string {
    if (classItem.classTeacher) {
      return `${classItem.classTeacher.firstName} ${classItem.classTeacher.lastName}`;
    }
    return 'Not Assigned';
  }

  retry() {
    this.loadClasses();
  }
}
