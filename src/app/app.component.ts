import { Component } from '@angular/core';
import { RPCComponent} from './rethinkdb/subscription/subscription.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent extends RPCComponent {
  title = 'app';
  color = 'red';

  create_red_car(matricula) {
    this.rpc('create_red_car', {matricula: matricula}, (x) => console.log(x));
  }

}
