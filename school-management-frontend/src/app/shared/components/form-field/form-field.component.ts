import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  standalone: false
})
export class FormFieldComponent {
  @Input() control!: FormControl;
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() required: boolean = false;
  @Input() hint: string = '';

  getErrorMessage(): string {
    if (this.control.hasError('required')) {
      return `${this.label} is required`;
    }
    if (this.control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (this.control.hasError('minlength')) {
      const minLength = this.control.errors?.['minlength'].requiredLength;
      return `${this.label} must be at least ${minLength} characters`;
    }
    if (this.control.hasError('maxlength')) {
      const maxLength = this.control.errors?.['maxlength'].requiredLength;
      return `${this.label} must not exceed ${maxLength} characters`;
    }
    if (this.control.hasError('pattern')) {
      return `${this.label} format is invalid`;
    }
    if (this.control.hasError('min')) {
      const min = this.control.errors?.['min'].min;
      return `${this.label} must be at least ${min}`;
    }
    if (this.control.hasError('max')) {
      const max = this.control.errors?.['max'].max;
      return `${this.label} must not exceed ${max}`;
    }
    return 'Invalid input';
  }
}
