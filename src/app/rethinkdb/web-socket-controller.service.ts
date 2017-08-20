import { Injectable } from '@angular/core';
import EJSON from 'ejson';

const callbacks = [];
let id = 0;
const subs = [];

class WS {
  ws: WebSocket;
  ready: boolean;

  constructor() {
    this.ready = false;
    this.ws = new WebSocket('ws://localhost:8888/ws');
    this.ws.onopen = (evt) => {
      this.ready = true;
      for (const s of subs) {
        this.sendSub(s[0], s[1], s[2]);
      }
    };
    this.ws.onmessage = (evt) => {
      console.log('->', evt.data);
      const data = JSON.parse(evt.data);
      const callback = callbacks[data.id];
      if (callback) {
        if (data.msg === 'method') {
          callback(data.result);
        } else {
          callback(data);
        }
      }
    };
    this.ws.onclose = (evt) => {
      this.ready = false;
    };
  }

  sendSub (name, id, params) {
    const data = {msg: 'sub', name: name, id: id, params: params};
    this.ws.send(JSON.stringify(data));
  }

  sendUnSub (id) {
    const data = {msg: 'unsub', id: id};
    this.ws.send(JSON.stringify(data));
  }

  sendRPC (name, id, params) {
    const data = {msg: 'method', method: name, id: id, params: params};
    this.ws.send(JSON.stringify(data));
  }
}

@Injectable()
export class WebSocketControllerService {

  ws: WS;

  constructor() {
    this.ws = new WS();
  }

  sub(name, filter, callback) {
      id += 1;
      callbacks[id] = callback;
      subs.push([name, id, filter]);
    if (this.ws.ready) {
      this.ws.sendSub(name, id, filter);
      return id;
    } else {
      return -1;
    }
  }

  unsub (subId: number) {
    delete subs[subId];
    if (this.ws.ready) {
      this.ws.sendUnSub(id);
    }
  }

  rpc (name, params, callback?) {
    if (this.ws.ready) {
      id += 1;
      this.ws.sendRPC(name, id, params);
      if (callback) {
        callbacks[id] = callback;
      }
    }
  }
}
