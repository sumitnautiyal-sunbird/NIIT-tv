import { Directive,
  Attribute,
  Renderer2,
  ElementRef,
  HostListener,
  Input,
  HostBinding} from '@angular/core';

@Directive({
  selector: '[appImagePreload]'
})
export class ImagePreloadDirective {
  @Input() srcimg;
  @HostBinding('class') className;
  @HostListener('load') onLoad() {
    if (this.srcimg === null) {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.defaultimage);
    } else {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.srcimg);
    }
  }
  @HostListener('error') onError() {
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.defaultimage);
  }
  constructor(@Attribute('defaultimage') public defaultimage: string, private renderer: Renderer2, private el: ElementRef) {
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.defaultimage);
    }

}
