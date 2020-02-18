import { TestBed, inject } from '@angular/core/testing';

import { GetaccesstokenService } from './getaccesstoken.service';

describe('GetaccesstokenService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GetaccesstokenService]
    });
  });

  it('should be created', inject([GetaccesstokenService], (service: GetaccesstokenService) => {
    expect(service).toBeTruthy();
  }));
});
