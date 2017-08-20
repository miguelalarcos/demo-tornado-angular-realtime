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

  sendSub (name, subId, params) {
    const data = {msg: 'sub', name: name, id: subId, params: params};
    this.ws.send(JSON.stringify(data));
  }

  sendUnSub (subId) {
    const data = {msg: 'unsub', id: subId};
    this.ws.send(JSON.stringify(data));
  }

  sendRPC (name, RPCId, params) {
    const data = {msg: 'method', method: name, id: RPCId, params: params};
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
    }
    return id;
  }

  unsub (subId: number) {
    delete subs[subId];
    if (this.ws.ready) {
      this.ws.sendUnSub(subId);
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
