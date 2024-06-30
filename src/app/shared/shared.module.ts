import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelService } from './services/excel/excel.service';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CustomStatsToolPanel } from './components/computed-tool-panel/computed-tool-panel.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonToggleModule, 
    MatCheckboxModule,
    MatButtonModule
  ],
  exports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonToggleModule, 
    MatCheckboxModule,
    MatButtonModule
  ],
  providers: [
    ExcelService
  ],

})
export class SharedModule { }
