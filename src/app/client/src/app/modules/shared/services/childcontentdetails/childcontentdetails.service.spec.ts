import { TestBed, inject } from '@angular/core/testing';

import { ChildcontentdetailsService } from './childcontentdetails.service';

describe('ChildcontentdetailsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChildcontentdetailsService]
    });
  });

  it('should be created', inject([ChildcontentdetailsService], (service: ChildcontentdetailsService) => {
    expect(service).toBeTruthy();
  }));
});
