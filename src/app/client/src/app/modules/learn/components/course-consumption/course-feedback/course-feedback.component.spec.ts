import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseFeedbackComponent } from './course-feedback.component';

describe('CourseFeedbackComponent', () => {
  let component: CourseFeedbackComponent;
  let fixture: ComponentFixture<CourseFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CourseFeedbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
