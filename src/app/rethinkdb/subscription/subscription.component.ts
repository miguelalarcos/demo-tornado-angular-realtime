import { Component } from '@angular/core';
import { WebSocketControllerService } from '../web-socket-controller.service';
import _ from 'underscore';

@Component({
  selector: 'app-rpc',
  template: '<span></span>',
})
export class RPCComponent {

  constructor(protected ws: WebSocketControllerService) { }

  rpc(name, params, callback){
    this.ws.rpc(name, params, callback);
  }
}

@Component({
  selector: 'app-subscription',
  template: '<span></span>',
  // styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent {

  subId: number = null;
  store = [];
  sort_keys = [];

  constructor(protected ws: WebSocketControllerService) { }

  sub(name: string, filter: object) {
    this.unsub();
    this.subId = this.ws.sub(name, filter, this.handle.bind(this));
  }

  unsub() {
    this.store.splice(0, this.store.length);
    if (this.subId != null) {
      this.ws.unsub(this.subId);
    }
  }

  rpc(name, params, callback){
    this.ws.rpc(name, params, callback);
  }

  handle(msg) {
    if (msg.msg === 'added') {
      const index = this.sort_index(msg.doc);
      this.store.splice(index, 0, msg.doc);
    } else if (msg.msg === 'changed') {
      const tmp = this.store.slice();
      let index = _.findIndex(tmp, (x, i) => x.id === msg.doc.id);
      this.store.splice(index, 1);
      index = this.sort_index(msg.doc);
      this.store.splice(index, 0, msg.doc);
    } else {
      const tmp = this.store.slice();
      const index = _.findIndex(tmp, (x, i) => x.id === msg.doc_id);
      this.store.splice(index, 1);
    }
  }

  sort_index (new_val) {
    const values = this.store.slice();
    let index = 0;
    for (const x of values){
      const v = this.sort_cmp(x, new_val);
      if (v < 0) {
        return index;
      }
      index += 1;
    }
    return index;
  }

  sort_cmp (x, new_val) {
    const sort_keys = this.sort_keys.slice();
    const ret = 0;
    let t = 'asc';
    let k = null;
    while (sort_keys.length !== 0) {
      [k, t] = sort_keys.shift();
      if (x[k] >= new_val[k]) {
        return t === 'asc' ? -1 : 1;
      } else if (x[k] <= new_val[k]) {
        return t === 'asc' ? 1 : -1;
      }
    }
    return ret;
  }

}
