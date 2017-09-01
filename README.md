Do you know about [Meteor](http://www.meteor.com)? You should! Meteor is one of the most awesome things about web apps.

This demo aims to follow Meteor but with differents elements. I use Python server side (plus Rethinkdb) and Angular client side. Let's see the differences:

Meteor subscriptions:
```javascript
Meteor.publish('posts', function() {
  return Posts.find({
    owner: this.userId
  });
});
```

And we have:
```python
@sub
def posts(self):
  return r.table('Posts').filter({'owner': self.user_id})
```

Meteor methods:
```javascript
Meteor.methods({
  foo(arg1, arg2) {
    check(arg1, String);
    check(arg2, Number);
    // Do stuff...
    return 'some return value';
  }
});
```

And we have in this demo:
```python
@method
def foo(self, arg1, arg2):
    self.check(arg1, str)
    self.check(arg2, int)    
    # Do stuff...        
    return 'some return value';
```

Permission, validation and hooks out of the box:
```python
@can_insert('cars')
def is_logged(self, doc):
    return self.user_id is not None

@can_update('cars')
def is_owner(self, doc, old_doc):
    return old_doc['owner'] == self.user_id

@can_delete('cars')
def is_owner(self, old_doc):
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
```

Client side,

Meteor
```html
<template name="cars">
  <ul>
    {{#each cars}}
    <li>
      {{matricula}}, {{format_date date}}, <button class="delete">delete car</button>
    </li>
    {{/each}}
  </ul>
</template>
```

my demo
```html
<ul>
  <li *ngFor="let car of store">
    {{car.matricula}}, {{format_date(car.created_at)}}, <button (click)="delete_car(car.id)">delete car</button>
  </li>
</ul>
```

Meteor
```javascript
Template.cars.onCreated(function () { 
  var self = this;
  self.autorun(function () {
    self.subscribe('cars', this.color);
  });
});

Template.cars.events({
  'click .delete'(evt, tmpl){
    Meteor.call('delete_car', this.id);
  }
})

Template.cars.helpers({
  cars(){
    return Cars.find({color: this.color});
  },
  format_date(date){
    return moment(date).format();
  }
});
```

my demo
```typescript
@Component({
  selector: 'app-cars',
  templateUrl: './cars.component.html',
  styleUrls: ['./cars.component.css']
})
export class CarsComponent extends SubscriptionComponent {

  @Input()
  public set color(val: string){
    this.sub('cars_of_color', {color: val}); // every time color changes, we unsub previous sub and do a new one
  }

  sort_keys = [['matricula', 'asc']]; // the component has a store where incoming data is saved. sort_keys is useful to sort store when displaying

  constructor(protected ws: WebSocketControllerService) { // ws has rpc method
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

Meteor
```html
<div>
  {{>loginButtons}}

  <span>showing {{color}}</span>
  <button class="toggle-color">blue|red</button>
  {{> cars color=color}}
  <form>
    <span>Matricula:</span>
    <input type="text" value={{doc.matricula}} name="matricula" >
    <span>Power:</span>
    <input type="text" value={{doc.power}} name="power">
    <span class="error">{{errors.power}}</span>
    <span>Date:</span>
    <datetimepicker value={{doc.date}} name="date" />
    <button class='create-car'>create car</button>
  </form>
</div>
```

my demo
```html
<div>
  <div>
    <div *ngIf="!user" class="g-signin2" (click)="googleLogin()" data-theme="dark"></div>
    <button *ngIf="user" (click)="signOut()">signout</button>
  </div>

  <span>showing {{color}}</span>
  <button (click)="color=color=='blue'?'red':'blue'">blue|red</button>
  <app-cars [color]="color"></app-cars>
  <form>
    <span>Matricula:</span>
    <input type="text" [(ngModel)]="doc.matricula" type="text" name="matricula" >
    <span>Power:</span>
    <input type="text" class="form-control" [(ngModel)]="doc.power" #name="ngModel" number name="power">
    <span class="error">{{errors.power}}</span>
    <span>Date:</span>
    <input [(ngModel)]="doc.date" ngui-datetime-picker date-only="true" name="date" /> <!--date-format="DD-MM-YYYY HH:mm" />-->
    <button (click)="create_car()">create car</button>
  </form>
</div>
```

Meteor
```javascript
Template.main.onCreated(function () {
  this.color = new ReactiveVar('red');
  this.doc = new ReactiveDict();
}); 

Template.main.helpers({
  color(){
    return Template.instance().data.color;
  }
});

Template.main.events({
  'change input'(evt, tmpl){
    val = evt.taget.value;
    tmpl.data.doc.set($(evt.target).attr("name"), val):
  },
  'click .toggle-color'(evt, tmpl){
    color = tmpl.data.color.get() === 'red'? 'blue': 'red';
    tmpl.data.color.set(color);
  },
  'click .create-car'(evt, tmpl){
    Meteor.call('createCar', tmpl.data.doc);
  }
});
```

my demo
```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  color = 'red';
  user;
  doc = {power: 1, date: '', color: '', matricula: ''};
  errors = {power: null, date: '', color: '', matricula: ''};

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

  create_car() {
    const doc = clone(this.doc, false);
    doc.color = this.color;
    const valid = validateCar(doc);
    if (!valid) {
      console.log('not valid:');
    } else {
      this.ws.rpc('create_car', doc, (x) => console.log(x));
    }
  }
}
```

Install and run:		
  		  
* install rethinkdb
* npm install		 (tested using node v8.3.0 (npm v5.3.0))
* ng serve		 
* rethinkdb (go to http://localhost:8080/ and create table 'cars' in database 'test')
* pip install -r requirements.txt		
* python main.py		 (tested with Python3.5.3)
* open two browsers at localhost:8888		 
* play with the app and see both browsers updating screen
