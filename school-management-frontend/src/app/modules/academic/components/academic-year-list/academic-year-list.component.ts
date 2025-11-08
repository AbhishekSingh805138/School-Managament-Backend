import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';

import { AcademicService } from '../../../../services/academic.service';
import { NotificationService } from '../../../../services/notification.service';
import { AcademicYear } from '../../../../models/academic.model';
import { AcademicYearFormComponent } from '../academic-year-form/academic-year-form.component';

@Component({
  selector: 'app-academic-year-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatCardModule],
  templateUrl: './academic-year-list.component.html',
  styleUrl: './academic-year-list.component.scss'
})
export class AcademicYearListComponent implements OnInit {
  academicYears: AcademicYear[] = [];
  displayedColumns: string[] = ['name', 'startDate', 'endDate', 'isActive', 'actions'];
  isLoading = false;

  constructor(
    private academicService: AcademicService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadAcademicYears();
  }

  loadAcademicYears() {
    this.isLoading = true;
    this.academicService.getAcademicYears().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.academicYears = response.data.items;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Failed to load academic years');
        this.isLoading = false;
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(AcademicYearFormComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAcademicYears();
      }
    });
  }

  openEditDialog(academicYear: AcademicYear) {
    const dialogRef = this.dialog.open(AcademicYearFormComponent, {
      width: '500px',
      data: academicYear
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAcademicYears();
      }
    });
  }

  setActive(academicYear: AcademicYear) {
    this.academicService.setActiveAcademicYear(academicYear.id).subscribe({
      next: () => {
        this.notificationService.success('Academic year activated successfully');
        this.loadAcademicYears();
      },
      error: () => {
        this.notificationService.error('Failed to activate academic year');
      }
    });
  }

  deleteAcademicYear(academicYear: AcademicYear) {
    if (confirm(`Are you sure you want to delete ${academicYear.name}?`)) {
      this.academicService.deleteAcademicYear(academicYear.id).subscribe({
        next: () => {
          this.notificationService.success('Academic year deleted successfully');
          this.loadAcademicYears();
        },
        error: () => {
          this.notificationService.error('Failed to delete academic year');
        }
      });
    }
  }
}
