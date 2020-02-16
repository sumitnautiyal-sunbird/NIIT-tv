import { TestBed } from '@angular/core/testing';

import { CourseFeedbackUtilityService } from './course-feedback-utility.service';

describe('CourseFeedbackUtilityService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CourseFeedbackUtilityService = TestBed.get(CourseFeedbackUtilityService);
    expect(service).toBeTruthy();
  });
});
