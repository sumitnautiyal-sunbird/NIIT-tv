import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseDeliveryPageComponent } from './course-delivery-page.component';

describe('CourseDeliveryPageComponent', () => {
  let component: CourseDeliveryPageComponent;
  let fixture: ComponentFixture<CourseDeliveryPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CourseDeliveryPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseDeliveryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
