import { Component } from '@angular/core';
import {WebSocketControllerService} from './rethinkdb/web-socket-controller.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  color = 'red';

  constructor (private ws: WebSocketControllerService) {}

  create_car_of_color(matricula, color) {
    this.ws.rpc('create_car_of_color', {matricula: matricula, color: color},
      (x) => console.log(x));
  }

}
