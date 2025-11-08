import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AcademicService } from '../../../../services/academic.service';
import { NotificationService } from '../../../../services/notification.service';
import { AcademicYear } from '../../../../models/academic.model';

@Component({
  selector: 'app-academic-year-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './academic-year-form.component.html',
  styleUrl: './academic-year-form.component.scss'
})
export class AcademicYearFormComponent implements OnInit {
  academicYearForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private academicService: AcademicService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<AcademicYearFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AcademicYear | null
  ) {}

  ngOnInit() {
    this.isEditMode = !!this.data;
    this.initForm();
  }

  initForm() {
    this.academicYearForm = this.fb.group({
      name: [this.data?.name || '', [Validators.required, Validators.minLength(4)]],
      startDate: [this.data?.startDate ? new Date(this.data.startDate) : '', Validators.required],
      endDate: [this.data?.endDate ? new Date(this.data.endDate) : '', Validators.required]
    });
  }

  onSubmit() {
    if (this.academicYearForm.invalid) {
      this.markFormGroupTouched(this.academicYearForm);
      return;
    }

    this.isLoading = true;
    const formValue = this.academicYearForm.value;
    
    // Format dates to ISO string
    const academicYearData = {
      ...formValue,
      startDate: new Date(formValue.startDate).toISOString().split('T')[0],
      endDate: new Date(formValue.endDate).toISOString().split('T')[0]
    };

    const request = this.isEditMode
      ? this.academicService.updateAcademicYear(this.data!.id, academicYearData)
      : this.academicService.createAcademicYear(academicYearData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.notificationService.success(
            `Academic year ${this.isEditMode ? 'updated' : 'created'} successfully`
          );
          this.dialogRef.close(true);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.error(
          `Failed to ${this.isEditMode ? 'update' : 'create'} academic year`
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
    return this.academicYearForm.get('name');
  }

  get startDate() {
    return this.academicYearForm.get('startDate');
  }

  get endDate() {
    return this.academicYearForm.get('endDate');
  }
}
