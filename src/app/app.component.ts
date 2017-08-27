import { Component, OnInit } from '@angular/core';
import { Okta } from './okta/okta.service';
import {ChangeDetectorRef } from '@angular/core';
import {WebSocketControllerService} from './rethinkdb/web-socket-controller.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'app';
  color = 'red';
  user;
  oktaSignIn;

  constructor (private okta: Okta, private ref: ChangeDetectorRef,
               private ws: WebSocketControllerService) {
    this.oktaSignIn = okta.getWidget();
  }

  login(token) {
    this.ws.rpc('login', {token: token}, (ret) => {
      console.log('--->ret:', ret)
      this.user = ret;
    });
  }

  create_car(matricula, color) {
    this.ws.rpc('create_car', {matricula: matricula, color: color},
      (x) => console.log(x));
  }

  showLogin() {
    this.oktaSignIn.remove();
    setTimeout(() => {
      this.oktaSignIn.renderEl({el: '#okta-login-container'}, (response) => {
        if (response.status === 'SUCCESS') {
          this.login(response[1].accessToken);
        }
      });
    }, 0);
  }

  ngOnInit() {
    this.oktaSignIn.session.get((response) => {
      if (response.status !== 'INACTIVE') {
        console.log(response);
        this.user = response.login;
        this.ref.detectChanges();
      } else {
        this.showLogin();
      }
    });
  }

  logout() {
    this.oktaSignIn.signOut((err) => {
      console.log('err:', err);
      this.user = undefined;
      this.showLogin();
      this.ref.detectChanges();
    });
  }

}
