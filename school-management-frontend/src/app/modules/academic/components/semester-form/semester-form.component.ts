import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AcademicService } from '../../../../services/academic.service';
import { NotificationService } from '../../../../services/notification.service';
import { Semester, AcademicYear } from '../../../../models/academic.model';

interface SemesterFormData {
  academicYears: AcademicYear[];
  semester: Semester | null;
}

@Component({
  selector: 'app-semester-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './semester-form.component.html',
  styleUrl: './semester-form.component.scss'
})
export class SemesterFormComponent implements OnInit {
  semesterForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  academicYears: AcademicYear[] = [];

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<SemesterFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SemesterFormData
  ) {
    this.academicYears = data.academicYears;
  }

  ngOnInit() {
    this.isEditMode = !!this.data.semester;
    this.initForm();
  }

  initForm() {
    const semester = this.data.semester;
    this.semesterForm = this.fb.group({
      name: [semester?.name || '', [Validators.required, Validators.minLength(3)]],
      academicYearId: [semester?.academicYearId || '', Validators.required],
      startDate: [semester?.startDate ? new Date(semester.startDate) : '', Validators.required],
      endDate: [semester?.endDate ? new Date(semester.endDate) : '', Validators.required]
    });
  }

  onSubmit() {
    if (this.semesterForm.invalid) {
      this.markFormGroupTouched(this.semesterForm);
      return;
    }

    this.isLoading = true;
    const formValue = this.semesterForm.value;
    
    // Format dates to ISO string
    const semesterData = {
      ...formValue,
      startDate: new Date(formValue.startDate).toISOString().split('T')[0],
      endDate: new Date(formValue.endDate).toISOString().split('T')[0]
    };

    const request = this.isEditMode
      ? this.academicService.updateSemester(this.data.semester!.id, semesterData)
      : this.academicService.createSemester(semesterData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.notificationService.success(
            `Semester ${this.isEditMode ? 'updated' : 'created'} successfully`
          );
          this.dialogRef.close(true);
        }
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.error(
          `Failed to ${this.isEditMode ? 'update' : 'create'} semester`
        );
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get name() {
    return this.semesterForm.get('name');
  }

  get academicYearId() {
    return this.semesterForm.get('academicYearId');
  }

  get startDate() {
    return this.semesterForm.get('startDate');
  }

  get endDate() {
    return this.semesterForm.get('endDate');
  }
}
