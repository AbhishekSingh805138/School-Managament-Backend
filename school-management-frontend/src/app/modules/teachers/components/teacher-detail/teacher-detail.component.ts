import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { TeacherService } from '../../../../services/teacher.service';
import { NotificationService } from '../../../../services/notification.service';
import { Teacher } from '../../../../models/teacher.model';
import { TeacherFormComponent } from '../teacher-form/teacher-form.component';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.scss'
})
export class TeacherDetailComponent implements OnInit {
  teacher: Teacher | null = null;
  isLoading = true;
  teacherId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.teacherId = this.route.snapshot.params['id'];
    this.loadTeacher();
  }

  loadTeacher() {
    this.isLoading = true;
    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teacher = response.data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load teacher details');
        this.isLoading = false;
        this.router.navigate(['/teachers']);
      }
    });
  }

  openEditDialog() {
    if (!this.teacher) return;

    const dialogRef = this.dialog.open(TeacherFormComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: this.teacher
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeacher();
      }
    });
  }

  deleteTeacher() {
    if (!this.teacher) return;

    if (confirm(`Are you sure you want to delete ${this.getTeacherName()}?`)) {
      this.teacherService.deleteTeacher(this.teacher.id).subscribe({
        next: () => {
          this.notificationService.success('Teacher deleted successfully');
          this.router.navigate(['/teachers']);
        },
        error: () => {
          this.notificationService.error('Failed to delete teacher');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/teachers']);
  }

  getTeacherName(): string {
    if (!this.teacher) return '';
    return `${this.teacher.user.firstName} ${this.teacher.user.lastName}`;
  }

  getSubjectCount(): number {
    return this.teacher?.subjects?.length || 0;
  }

  getClassCount(): number {
    return this.teacher?.classes?.length || 0;
  }
}
