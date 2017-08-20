import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionComponent, RPCComponent } from './subscription/subscription.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SubscriptionComponent, RPCComponent] // ,
  // exports: [SubscriptionComponent]
})
export class RethinkdbModule { }
