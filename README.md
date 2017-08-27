This demo tries to demonstrate how to use Angular 2 client side and Python (Tornado) with Rethinkdb server side.

These are the relevant parts:

Server side:

```python
class App(SDP):

    @method
    def add(self, a, b):
        return a + b

    @can_insert('cars')
    def is_logged(self, doc):
        return self.user_id is not None

    @can_update('cars')
    def is_owner(self, doc, old_doc):
        return old_doc['owner'] == self.user_id

    @before_insert('cars')
    def created_at(self, doc):
        doc['created_at'] = datetime.now(timezone.utc)
        doc['owner'] = self.user_id

    @method
    def change_color(self, id, color):
        yield self.update('cars', id, {'color': color})

    @method
    def create_car(self, **car):
        car_validator.validate(car)
        yield self.insert('cars', car)

    @method
    def create_car_of_color(self, color, matricula):
        self.check(color, str)
        self.check(matricula, str)
        yield self.insert('cars', {'matricula': matricula, 'color': color})

    @method
    def delete_car(self, id):
        yield self.soft_delete('cars', id)

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
```

cars.component.html
```html
<ul>
  <li *ngFor="let car of store">
    {{car.matricula}}, {{format_date(car.created_at)}}, <button (click)="delete_car(car.id)">delete car</button>
  </li>
</ul>
```

app.component.html
```html
<div>
  <div>
    <div class="g-signin2" (click)="googleLogin()" data-theme="dark"></div>
    <button (click)="signOut()">signout</button>
  </div>

  <span>showing {{color}}</span>
  <button (click)="color=color=='blue'?'red':'blue'">blue|red</button>
  <app-cars [color]="color"></app-cars>
  <input #matricula type="text">
  <button (click)="create_car(matricula.value, 'red')">create red car</button>
  <button (click)="create_car(matricula.value, 'blue')">create blue car</button>
</div>
```

app.component.ts
```typescript
declare const gapi: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'app';
  color = 'red';
  user;

  constructor ( private ws: WebSocketControllerService) {
    gapi.load('auth2', function () {
      gapi.auth2.init();
    });
  }

  googleLogin() {
    const googleAuth = gapi.auth2.getAuthInstance();
    googleAuth.then(() => {
      googleAuth.signIn({scope: 'profile email'}).then(googleUser => {
        this.login(googleUser.getAuthResponse().access_token);
      });
    });
  }

  signOut() {
    gapi.auth2.getAuthInstance().disconnect();
    this.ws.rpc('glogout', {}, (ret) => {
      this.user = null;
    });
  }

  login(token) {
    this.ws.rpc('glogin', {token: token}, (ret) => {
      this.user = ret;
    });
  }

  create_car(matricula, color) {
    this.ws.rpc('create_car', {matricula: matricula, color: color},
      (x) => console.log(x));
  }
}
```

app.module.ts
```typescript
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

* install rethinkdb
* npm install
* ng build
* rethinkdb (http://localhost:8080/ and create table 'cars' in database 'test')
* pip install -r requirements.txt
* python main.py
* open two browser at localhost:8888
* play with the app and see both browsers updating screen
