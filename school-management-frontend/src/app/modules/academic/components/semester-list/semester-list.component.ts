import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { AcademicService } from '../../../../services/academic.service';
import { NotificationService } from '../../../../services/notification.service';
import { Semester, AcademicYear } from '../../../../models/academic.model';
import { SemesterFormComponent } from '../semester-form/semester-form.component';

@Component({
  selector: 'app-semester-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './semester-list.component.html',
  styleUrl: './semester-list.component.scss'
})
export class SemesterListComponent implements OnInit {
  semesters: Semester[] = [];
  academicYears: AcademicYear[] = [];
  selectedAcademicYearId: string = '';
  displayedColumns: string[] = ['name', 'academicYear', 'startDate', 'endDate', 'isActive', 'actions'];
  isLoading = false;

  constructor(
    private academicService: AcademicService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadAcademicYears();
    this.loadSemesters();
  }

  loadAcademicYears() {
    this.academicService.getAcademicYears().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.academicYears = response.data.items;
        }
      },
      error: () => {
        this.notificationService.error('Failed to load academic years');
      }
    });
  }

  loadSemesters() {
    this.isLoading = true;
    const params = this.selectedAcademicYearId ? { academicYearId: this.selectedAcademicYearId } : undefined;
    
    this.academicService.getSemesters(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.semesters = response.data.items;
        }
        this.isLoading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load semesters');
        this.isLoading = false;
      }
    });
  }

  onAcademicYearChange() {
    this.loadSemesters();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(SemesterFormComponent, {
      width: '500px',
      data: { academicYears: this.academicYears, semester: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSemesters();
      }
    });
  }

  openEditDialog(semester: Semester) {
    const dialogRef = this.dialog.open(SemesterFormComponent, {
      width: '500px',
      data: { academicYears: this.academicYears, semester }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSemesters();
      }
    });
  }

  setActive(semester: Semester) {
    this.academicService.setActiveSemester(semester.id).subscribe({
      next: () => {
        this.notificationService.success('Semester activated successfully');
        this.loadSemesters();
      },
      error: () => {
        this.notificationService.error('Failed to activate semester');
      }
    });
  }

  deleteSemester(semester: Semester) {
    if (confirm(`Are you sure you want to delete ${semester.name}?`)) {
      this.academicService.deleteSemester(semester.id).subscribe({
        next: () => {
          this.notificationService.success('Semester deleted successfully');
          this.loadSemesters();
        },
        error: () => {
          this.notificationService.error('Failed to delete semester');
        }
      });
    }
  }

  getAcademicYearName(academicYearId: string): string {
    const year = this.academicYears.find(y => y.id === academicYearId);
    return year?.name || 'N/A';
  }
}
