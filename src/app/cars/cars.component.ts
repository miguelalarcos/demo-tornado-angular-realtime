import { Input, Component } from '@angular/core';
import { SubscriptionComponent } from '../rethinkdb/subscription/subscription.component';
import { WebSocketControllerService } from '../rethinkdb/web-socket-controller.service';

@Component({
  selector: 'app-cars',
  templateUrl: './cars.component.html',
  styleUrls: ['./cars.component.css']
})
export class CarsComponent extends SubscriptionComponent {

  @Input()
  public set color(val: string){
    this.sub('cars_of_color', {color: val});
  }

  sort_keys = [['matricula', 'asc']];

  constructor(protected ws: WebSocketControllerService) {
    super(ws);
  }

  log_car(car) {
    this.ws.rpc('log_object', car);
  }

}
