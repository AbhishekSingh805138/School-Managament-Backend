import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'dateFormat',
  standalone: false
})
export class DateFormatPipe implements PipeTransform {
  private datePipe = new DatePipe('en-US');

  transform(value: any, format: string = 'mediumDate'): string | null {
    if (!value) return null;
    return this.datePipe.transform(value, format);
  }
}
