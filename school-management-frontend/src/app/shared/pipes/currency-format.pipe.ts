import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({
  name: 'currencyFormat',
  standalone: false
})
export class CurrencyFormatPipe implements PipeTransform {
  private currencyPipe = new CurrencyPipe('en-US');

  transform(value: number | null | undefined, currencyCode: string = 'USD', display: string = 'symbol'): string | null {
    if (value === null || value === undefined) return null;
    return this.currencyPipe.transform(value, currencyCode, display);
  }
}
