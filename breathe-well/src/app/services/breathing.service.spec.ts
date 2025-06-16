import { TestBed } from '@angular/core/testing';

import { BreathingService } from './breathing.service';

describe('BreathingService', () => {
  let service: BreathingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BreathingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
