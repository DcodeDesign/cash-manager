import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';
import { SharedModule } from './shared/shared.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatExpansionModule} from '@angular/material/expansion';
import { ServiceWorkerModule } from '@angular/service-worker';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

const dbConfig: DBConfig  = {
  name: 'CashManagarDB',
  version: 1,
  objectStoresMeta: [
    {
      store: 'data',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'data', keypath: 'data', options: { unique: false } },
      ]
    },
    {
      store: 'dataFilter',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'dataFilter', keypath: 'dataFilter', options: { unique: false } },
      ]
    }
  ]
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatSelectModule,
    MatExpansionModule,
    MatProgressSpinnerModule,

    AgGridAngular,


    NgxIndexedDBModule.forRoot(dbConfig),
    SharedModule,

    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
