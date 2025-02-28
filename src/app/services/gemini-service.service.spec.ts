import { TestBed } from '@angular/core/testing';

import { GeminiServiceService } from './gemini-service.service';

describe('GeminiServiceService', () => {
  let service: GeminiServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeminiServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
