import { TestBed, inject } from '@angular/core/testing';

import { EnrolledcontentService } from './enrolledcontent.service';

describe('EnrolledcontentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EnrolledcontentService]
    });
  });

  it('should be created', inject([EnrolledcontentService], (service: EnrolledcontentService) => {
    expect(service).toBeTruthy();
  }));
});
