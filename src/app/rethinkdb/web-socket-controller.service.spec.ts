import { TestBed, inject } from '@angular/core/testing';

import { WebSocketControllerService } from './web-socket-controller.service';

describe('WebSocketControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebSocketControllerService]
    });
  });

  it('should be created', inject([WebSocketControllerService], (service: WebSocketControllerService) => {
    expect(service).toBeTruthy();
  }));
});
