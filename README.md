This demo tries to demonstrate how to use Angular 2 client side and Python (Tornado) with Rethinkdb server side.

These are the relevant parts:

Server side:

```python
class App(SDP):

    @method
    def add(self, a, b):
        return a + b

    @method
    def change_color(self, id, color):
        yield self.update('cars', id, {'color': color})

    @method
    def create_car_of_color(self, color, registration):
        yield self.insert('cars', {'registration': registration, 'color': color})

    @sub
    def cars_of_color(self, color):
        return r.table('cars').filter({'color': color})
```

Client side:

```typescript
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

  sort_keys = [['registration', 'asc']];

  constructor(protected ws: WebSocketControllerService) {
    super(ws);
  }

}
```

cars.component.html
```angular2html
<ul>
  <li *ngFor="let car of store">
    {{car.registration}}
  </li>
</ul>
```

app.component.html
```angular2html
<div>
  <span>showing {{color}}</span>
  <button (click)="color=color=='blue'?'red':'blue'">blue|red</button>
  <app-cars [color]="color"></app-cars>
  <input #registration type="text">
  <button (click)="create_car_of_color(registration.value, 'red')">create red car</button>
  <button (click)="create_car_of_color(registration.value, 'blue')">create blue car</button>
</div>

```

app.component.ts
```angularjs
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  color = 'red';

  constructor (private ws: WebSocketControllerService) {}

  create_car_of_color(registration, color) {
    this.ws.rpc('create_car_of_color', {registration: registration, color: color},
      (x) => console.log(x));
  }
}
```

app.module.ts
```angularjs
@NgModule({
  declarations: [
    AppComponent,
    CarsComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [WebSocketControllerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```


Install and run:

* npm install
* ng build
* rethinkdb (create table 'cars' in database 'test')
* python main.py
