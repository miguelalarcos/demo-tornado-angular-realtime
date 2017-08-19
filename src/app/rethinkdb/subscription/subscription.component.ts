import { Component } from '@angular/core';
import { WebSocketControllerService } from '../web-socket-controller.service';

@Component({
  selector: 'app-subscription',
  template: '<span></span>',
  // styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent {

  subId: number = null;

  constructor(protected ws: WebSocketControllerService) { }

  sub(name: string, filter: object) {
    this.unsub();
    this.subId = this.ws.sub(name, filter, (x) => console.log(x));
  }

  unsub() {
    if (this.subId != null) {
      this.ws.unsub(this.subId);
    }
  }

}
