import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent, NumberDirective } from './app.component';
import { CarsComponent } from './cars/cars.component';
import { WebSocketControllerService } from './rethinkdb/web-socket-controller.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NguiDatetimePickerModule } from '@ngui/datetime-picker';


@NgModule({
  declarations: [
    AppComponent,
    CarsComponent,
    NumberDirective
  ],
  imports: [
    BrowserModule, FormsModule, NguiDatetimePickerModule, ReactiveFormsModule
  ],
  providers: [WebSocketControllerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
