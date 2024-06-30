import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Observable, map } from 'rxjs';
import * as XLSX from 'xlsx';

import { read, utils, writeFile } from 'xlsx'

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(private dbService: NgxIndexedDBService) { }

  public readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: null});
        jsonData.fileName = file.name;
        resolve(jsonData);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    })
  }

  isInArray(array: string | any[], word: string) {
    return array.indexOf(word.toLowerCase()) > -1;
  }

  public saveData(data: any[]): Observable<any> {
    return this.dbService.bulkAdd('data', data);
  }

  public updateData(data: any[]): Observable<any> {
    return this.dbService.bulkPut('data', data);
  }

  public getData(): Observable<any> {
    return this.dbService.getAll('data');
  }

  public saveDataFilter(data: any): Observable<any> {
    return this.dbService.add('dataFilter', [data] );
  }

  public getDataFilter(): Observable<any> {
    return this.dbService.getAll('dataFilter');
  }

  public updateDataFilter(data: any[]): Observable<any> {
    return this.dbService.bulkPut('dataFilter', data);
  }

  public getLastDataFilter(): Observable<any> {
    return this.dbService.getAll('dataFilter').pipe(
      map(response => {
        console.log(response)

        const items = response;
        if(items && items.length > 0) {
          const last: any = items[items.length - 1];
console.log(last)
          const jsonObject: any[] = [];
          last.forEach((element: string) => {
            const item = JSON.parse(element);
            jsonObject.push(item)
          });

          return jsonObject[0];
        } else {
          return [];
        }
       
      })
    );
  }
}
