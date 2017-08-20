import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionComponent } from './subscription/subscription.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [SubscriptionComponent] // ,
  // exports: [SubscriptionComponent]
})
export class RethinkdbModule { }
