import { Component } from '@angular/core';
import {WebSocketControllerService} from './rethinkdb/web-socket-controller.service';

declare const gapi: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
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
