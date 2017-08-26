import { Injectable } from '@angular/core';
declare let OktaSignIn: any;

@Injectable()
export class Okta {
  widget;

  constructor() {
    this.widget = new OktaSignIn({
      baseUrl: 'https://dev-905907.oktapreview.com',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Oldacmelogo.png/200px-Oldacmelogo.png',
      clientId: '0oabsnw357Sd0GPQx0h7',
      redirectUri: 'http://localhost:4200/',
      authParams: {
        responseType: ['id_token', 'token'],
        responseMode: 'okta_post_message',
        scopes : [
          'openid',
          'email',
          'profile',
          'address',
          'phone'
        ]
      }
    });
  }

  getWidget() {
    return this.widget;
  }
}
