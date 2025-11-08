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

import { TeacherService } from '../../../../services/teacher.service';
import { NotificationService } from '../../../../services/notification.service';
import { Teacher } from '../../../../models/teacher.model';

@Component({
  selector: 'app-teacher-form',
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
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.scss'
})
export class TeacherFormComponent implements OnInit {
  teacherForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<TeacherFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Teacher | null
  ) {}

  ngOnInit() {
    this.isEditMode = !!this.data;
    this.initForm();
  }

  initForm() {
    const teacher = this.data;
    this.teacherForm = this.fb.group({
      firstName: [teacher?.user.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [teacher?.user.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [teacher?.user.email || '', [Validators.required, Validators.email]],
      phone: [teacher?.user.phone || '', [Validators.pattern(/^[0-9]{10,15}$/)]],
      address: [teacher?.user.address || ''],
      employeeId: [teacher?.employeeId || '', Validators.required],
      dateOfJoining: [teacher?.joiningDate ? new Date(teacher.joiningDate) : new Date(), Validators.required],
      qualification: [teacher?.qualification || '', Validators.required],
      specialization: [teacher?.specialization?.join(', ') || '', Validators.required]
    });

    if (this.isEditMode) {
      this.teacherForm.get('email')?.disable();
    }
  }

  onSubmit() {
    if (this.teacherForm.invalid) {
      this.markFormGroupTouched(this.teacherForm);
      return;
    }

    this.isLoading = true;
    const formValue = this.teacherForm.getRawValue();
    
    const teacherData = {
      ...formValue,
      joiningDate: new Date(formValue.dateOfJoining).toISOString().split('T')[0],
      specialization: formValue.specialization.split(',').map((s: string) => s.trim()),
      phoneNumber: formValue.phone
    };

    const request = this.isEditMode
      ? this.teacherService.updateTeacher(this.data!.id, teacherData)
      : this.teacherService.createTeacher(teacherData);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.notificationService.success(
            `Teacher ${this.isEditMode ? 'updated' : 'created'} successfully`
          );
          this.dialogRef.close(true);
        }
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.error(
          `Failed to ${this.isEditMode ? 'update' : 'create'} teacher`
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
}
