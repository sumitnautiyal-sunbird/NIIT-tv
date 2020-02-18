import { TestBed, inject } from '@angular/core/testing';

import { GetkeywordsService } from './getkeywords.service';

describe('GetkeywordsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GetkeywordsService]
    });
  });

  it('should be created', inject([GetkeywordsService], (service: GetkeywordsService) => {
    expect(service).toBeTruthy();
  }));
});
