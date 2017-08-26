import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { CarsComponent } from './cars/cars.component';
import { WebSocketControllerService } from './rethinkdb/web-socket-controller.service';
import { RethinkdbModule } from './rethinkdb/rethinkdb.module';
import { Okta } from './okta/okta.service';

@NgModule({
  declarations: [
    AppComponent,
    CarsComponent
  ],
  imports: [
    BrowserModule // ,
    // RethinkdbModule
  ],
  providers: [WebSocketControllerService, Okta],
  bootstrap: [AppComponent]
})
export class AppModule { }
