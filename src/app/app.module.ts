import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { CarsComponent } from './cars/cars.component';
import { WebSocketControllerService } from './rethinkdb/web-socket-controller.service';

@NgModule({
  declarations: [
    AppComponent,
    CarsComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [WebSocketControllerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
