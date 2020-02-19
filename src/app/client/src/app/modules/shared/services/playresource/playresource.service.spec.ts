import { TestBed, inject } from '@angular/core/testing';

import { PlayresourceService } from './playresource.service';

describe('PlayresourceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlayresourceService]
    });
  });

  it('should be created', inject([PlayresourceService], (service: PlayresourceService) => {
    expect(service).toBeTruthy();
  }));
});
