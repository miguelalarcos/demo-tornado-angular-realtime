import {Component, Directive, Output, EventEmitter } from '@angular/core';
import {WebSocketControllerService} from './rethinkdb/web-socket-controller.service';
import _ from 'underscore';
import { validateCar } from './cars/cars.component';
import clone from 'clone';
// import { NgModel, FormBuilder } from '@angular/forms';

declare const gapi: any;

@Directive({
  selector: '[ngModel][number]',
  host: {
    '(input)': 'onInputChange($event)'
  }
})
export class NumberDirective {
  @Output() ngModelChange: EventEmitter<any> = new EventEmitter();
  value: any;

  onInputChange($event) {
    // this.value = $event.target.value.toUpperCase();
    const val = $event.target.value;
    const reg = /^\d*$/;
    if (reg.test(val)) {
      this.value = val;
      this.ngModelChange.emit(parseInt(this.value, 10));
    } else {
      this.value = val;
      this.ngModelChange.emit(this.value);
    }
  }
}

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
  // myForm;

  constructor ( /*fb:FormBuilder,*/ private ws: WebSocketControllerService) {
    // this.myForm = fb.group({
    //   name: [''],
    // });
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
    console.log('this.doc:', this.doc);
    doc.color = this.color;
    const valid = validateCar(doc);
    if (!valid) {
      console.log('not valid:');
    } else {
      console.log('valid!!!')
      // this.ws.rpc('create_car', doc, // {matricula: matricula, color: color},
      //  (x) => console.log(x));
    }
  }
}
