import { Input, Component } from '@angular/core';
import { SubscriptionComponent } from '../rethinkdb/subscription/subscription.component';
import { WebSocketControllerService } from '../rethinkdb/web-socket-controller.service';
import * as moment from 'moment';
import * as Ajv from 'ajv';
import _ from 'underscore';

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

  delete_car(id) {
    this.ws.rpc('delete_car', {id: id});
  }

  format_date(date) {
    return moment(date).format();
  }

}

const carSchema = {
  type: 'object',
  properties: {
    matricula: {
      type: 'string'
    },
    color: {
      type: 'string'
    },
    power: {
      type: 'number'
    },
    date: {
      type: 'object',
      datetime: true
    }
  }
}

const ajv = new Ajv();

ajv.addKeyword('datetime', {
  validate: function (schema, data) {

    if (_.isDate(data)) {
      return true;
    } else {
      return false;
    }
  }, modifying: true, errors: false
});

export const validateCar = ajv.compile(carSchema);



