import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllcurriculumComponent } from './allcurriculum.component';

describe('AllcurriculumComponent', () => {
  let component: AllcurriculumComponent;
  let fixture: ComponentFixture<AllcurriculumComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllcurriculumComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllcurriculumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
