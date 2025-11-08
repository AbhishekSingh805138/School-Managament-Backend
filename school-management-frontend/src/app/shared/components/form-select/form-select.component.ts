import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-form-select',
  templateUrl: './form-select.component.html',
  styleUrls: ['./form-select.component.scss'],
  standalone: false
})
export class FormSelectComponent {
  @Input() control!: FormControl;
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() hint: string = '';
  @Input() options: SelectOption[] = [];

  getErrorMessage(): string {
    if (this.control.hasError('required')) {
      return `${this.label} is required`;
    }
    return 'Invalid selection';
  }
}
