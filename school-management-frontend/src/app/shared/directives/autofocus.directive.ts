import { Directive, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: false
})
export class AutofocusDirective implements AfterViewInit {
  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    }, 100);
  }
}
