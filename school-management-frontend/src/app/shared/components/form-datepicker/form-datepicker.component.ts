import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-form-datepicker',
  templateUrl: './form-datepicker.component.html',
  styleUrls: ['./form-datepicker.component.scss'],
  standalone: false
})
export class FormDatepickerComponent {
  @Input() control!: FormControl;
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() hint: string = '';
  @Input() minDate?: Date;
  @Input() maxDate?: Date;

  getErrorMessage(): string {
    if (this.control.hasError('required')) {
      return `${this.label} is required`;
    }
    if (this.control.hasError('matDatepickerMin')) {
      return `${this.label} cannot be before the minimum date`;
    }
    if (this.control.hasError('matDatepickerMax')) {
      return `${this.label} cannot be after the maximum date`;
    }
    return 'Invalid date';
  }
}
