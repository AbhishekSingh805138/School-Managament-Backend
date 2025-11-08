import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { StudentService } from '../../../../services/student.service';
import { NotificationService } from '../../../../services/notification.service';
import { Student } from '../../../../models/student.model';
import { StudentFormComponent } from '../student-form/student-form.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss'
})
export class StudentDetailComponent implements OnInit {
  student: Student | null = null;
  isLoading = true;
  studentId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.studentId = this.route.snapshot.params['id'];
    this.loadStudent();
  }

  loadStudent() {
    this.isLoading = true;
    this.studentService.getStudent(this.studentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.student = response.data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load student details');
        this.isLoading = false;
        this.router.navigate(['/students']);
      }
    });
  }

  openEditDialog() {
    if (!this.student) return;

    const dialogRef = this.dialog.open(StudentFormComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: this.student
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStudent();
      }
    });
  }

  deleteStudent() {
    if (!this.student) return;

    if (confirm(`Are you sure you want to delete ${this.getStudentName()}?`)) {
      this.studentService.deleteStudent(this.student.id).subscribe({
        next: () => {
          this.notificationService.success('Student deleted successfully');
          this.router.navigate(['/students']);
        },
        error: () => {
          this.notificationService.error('Failed to delete student');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/students']);
  }

  getStudentName(): string {
    if (!this.student) return '';
    return `${this.student.user.firstName} ${this.student.user.lastName}`;
  }

  getClassName(): string {
    return this.student?.class?.name || 'Not Assigned';
  }

  getAge(): number {
    if (!this.student?.dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(this.student.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
