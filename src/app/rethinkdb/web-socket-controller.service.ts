import { Injectable } from '@angular/core';
import EJSON from 'ejson';

const callbacks = [];
let id = 0;
const subs = {};

class Message { }

class MessageIn extends Message {
  constructor(public msg: string, public id: number, public doc: object, public result?: any) {
    super();
  }
}

class MessageOut extends Message {
  constructor() {
    super();
  }
}

class WS {
  input: Message[];
  ws: WebSocket;
  ready: boolean;

  constructor() {
    this.ready = false;
    this.ws = new WebSocket('ws://' + document.location.hostname + '/ws:8000');
    this.ws.onopen = (evt) => {
      this.ready = true;
    }
  }

  send(msg: Message) {
    //this.input.push(msg);
  }

  onInput() {
    /*while (this.ready && this.input.length > 0) {
      const msg = this.input.shift();
      this.ws.send(msg);
    }
    */
  }
}

@Injectable()
export class WebSocketControllerService {

  constructor() {
    console.log('ws created');
  }

  sub(name, filter, callback) {
    id += 1;
    console.log('sub', id, name, filter);
    callbacks[id] = callback;
    subs[id] = [name, filter, callback];
    return id;
    //this.onMessage(new Message('added', id, {matricula: 'A-123'}));
  }

  unsub(subId: number) {
    console.log('unsub', subId);
    delete subs[subId];
  }

  onMessage(smsg: string) {
    const msg = EJSON.parse(smsg);
    const callback = callbacks[msg.id];
    callback(msg.doc);
    delete callbacks[msg.id];
  }
}
