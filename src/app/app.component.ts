import { Component, OnInit, signal } from '@angular/core';
import { ClientSideRowModelModule, ColDef, DataTypeDefinition, GridApi, GridReadyEvent, IDateFilterParams, IsRowSelectable, ModuleRegistry, SideBarDef, ValueFormatterLiteParams, ValueParserLiteParams } from 'ag-grid-community';
import { ExcelService } from './shared/services/excel/excel.service';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { ColumnsToolPanelModule, GridChartsModule, MenuModule } from 'ag-grid-enterprise';
import { CustomStatsToolPanel } from './shared/components/computed-tool-panel/computed-tool-panel.component';
import * as lodash from 'lodash';
import moment from 'moment';


enum AgGriFilter {
  date = 'agDateColumnFilter',
  number = 'agNumberColumnFilter',
  text = 'agTextColumnFilter',
  set = 'agSetColumnFilter'
}

ModuleRegistry.registerModules([
  ColumnsToolPanelModule,
  MenuModule,
  GridChartsModule,
  ClientSideRowModelModule
]);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',

})
export class AppComponent implements OnInit {

  title = 'cash-manager';
  themeClass = "ag-theme-quartz-dark";

  categories = ['Autre', 'Taxes', 'Redevance' ,'Frais de gestion de compte', 'Syndicat', 'Entrée divers', 'Salaire principal', 'Famille et Enfants', 'Loisirs', 'Logement', 'Alimentation', 'Cadeaux', 'Assurance', 'Energie', 'Eau', 'Gaz','Prêt', 'Non indispensable']

  private gridApi!: GridApi<any>;

  agGriFilter = [
    { name: 'Date', value: AgGriFilter.date },
    { name: 'Nombre', value: AgGriFilter.number },
    { name: 'Set', value: AgGriFilter.set },
    { name: 'Text', value: AgGriFilter.text },
  ]

  grandTotalRow: 'top' | 'bottom' | undefined = 'bottom';

  enableCharts = true;
  enableRangeSelection = true;

  columnMenu: "legacy" | "new" = "legacy";
  sideBar: SideBarDef | string | string[] | boolean | null = {
    toolPanels: [
      {
        id: "columns",
        labelDefault: "Columns",
        labelKey: "columns",
        iconKey: "columns",
        toolPanel: "agColumnsToolPanel",
        width: 350
      },
      {
        id: "filters",
        labelDefault: "Filters",
        labelKey: "filters",
        iconKey: "filter",
        toolPanel: "agFiltersToolPanel",
        width: 350
      },
      {
        id: "customStats",
        labelDefault: "Custom Stats",
        labelKey: "customStats",
        iconKey: "custom-stats",
        toolPanel: CustomStatsToolPanel,
        toolPanelParams: {
          title: "Custom Stats",
        },
        width: 350
      },
    ],
    defaultToolPanel: "columns",
  };

  public dataTypeDefinitions: { [cellDataType: string]: DataTypeDefinition; } = {
    dateString: {
      baseDataType: "dateString",
      extendsDataType: "dateString",
      valueParser: (params: ValueParserLiteParams<any, string>) =>
        params.newValue != null && params.newValue.match("\\d{2}/\\d{2}/\\d{4}")
          ? params.newValue
          : null,
      valueFormatter: (
        params: ValueFormatterLiteParams<any, string>,
      ) => (params.value == null ? "" : params.value),
      dataTypeMatcher: (value: any) =>
        typeof value === "string" && !!value.match("\\d{2}/\\d{2}/\\d{4}"),
      dateParser: (value: string | undefined) => {
        if (value == null || value === "") {
          return undefined;
        }
        const dateParts = value.split("/");
        return dateParts.length === 3
          ? new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[0]),
          )
          : undefined;
      },
      dateFormatter: (value: Date | undefined) => {
        if (value == null) {
          return undefined;
        }
        const date = String(value.getDate());
        const month = String(value.getMonth() + 1);
        return `${date.length === 1 ? "0" + date : date}/${month.length === 1 ? "0" + month : month}/${value.getFullYear()}`;
      },
    }
  };

  filterParams: IDateFilterParams = {
    comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
      var dateAsString = cellValue;
      if (dateAsString == null) return -1;
      var dateParts = dateAsString.split("/");
      var cellDate = new Date(
        Number(dateParts[2]),
        Number(dateParts[1]) - 1,
        Number(dateParts[0]),
      );

      if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
        return 0;
      }

      if (cellDate < filterLocalDateAtMidnight) {
        return -1;
      }

      if (cellDate > filterLocalDateAtMidnight) {
        return 1;
      }
      return 0;
    },
    inRangeFloatingFilterDateFormat: "Do MMM YYYY",
  };

  defaultColDef: ColDef = {
    filter: AgGriFilter.text,
    floatingFilter: true,
    editable: true,
    hide: false,
    enableRowGroup: true,
    enableValue: true,
    menuTabs: ["filterMenuTab", "generalMenuTab"],
    flex: 1,
    minWidth: 150,
  }

  columnDefs: ColDef[] = [];
  rowData: any[] = [];

  hideMultipleSelectionIndicator = signal(true);

  columnList: any[] = [];
  fileName: any;
  filteredColumns: ColDef<any, any>[] = [];

  rowSelection: "single" | "multiple" = "multiple";
  selectedtCategory: any;
  rowdata: any;
  loadingSave = false;

  private columnCategory: ColDef = {
    headerName: "Catégorie",
    chartDataType: "category",
    field: '0',
    pinned: "left",
    filter: AgGriFilter.set,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: this.categories,
    }
  }

  private checkboxSelection: ColDef = {
    headerName: "",
    field: 'checkboxSelection',
    pinned: "left",
    floatingFilter: false,
    editable: true,
    hide: false,
    enableRowGroup: false,
    enableValue: false,
    menuTabs: [],
    width: 60,
    minWidth: 60,
    maxWidth: 60,
    flex: 1,
    sortable: false,
    resizable: false,
    headerCheckboxSelection: true,
    headerCheckboxSelectionFilteredOnly: true,
    checkboxSelection: true
  }

  private columnId: ColDef = {
    headerName: "#",
    field: 'id',
    pinned: "left",
    floatingFilter: false,
    editable: false,
    hide: true,
    enableRowGroup: false,
    enableValue: false,
    menuTabs: [],
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    flex: 1,
    sortable: false,
    resizable: false,
  }

  columnDefExist: boolean = false;

  constructor(private excelService: ExcelService) { }

  ngOnInit(): void {
    this.hideMultipleSelectionIndicator.update(value => true);
  }

  updateFilter() {
    this.gridApi.setGridOption("columnDefs", this.columnDefs);
    this.gridApi.refreshHeader();
    this.gridApi.redrawRows();
  }

  onGridReady(params: GridReadyEvent<any>) {
    this.gridApi = params.api;

    this.loadDataFromDB();
  }

  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);

    Array.from(target.files).forEach(element => {
      const file = element;

      this.excelService.readExcelFile(file).then((data: any) => {
        this.fileName = data.fileName;
        delete data.fileName;
        this.saveDataToDB(data);
        this.loadDataFromDB();
      });
    });
  }

  applyCategoryToCell() {
    const allRowData: any[] = [];
    let selectedRows = this.gridApi.getSelectedRows();
    selectedRows = selectedRows.map(node => {
      node[0] = this.selectedtCategory;
    })

    this.gridApi.forEachNode(node => {
        allRowData.push(node.data)
    });

    const result = lodash.merge(selectedRows, allRowData);

    this.gridApi.setGridOption("rowData", result);
  }

  processData(data: any[]) {

    this.excelService.getLastDataFilter().subscribe(response => {
      if (data.length > 0) {
        if (this.columnDefs.length === 0 && data.length > 0) {
          this.columnDefs = response.length > 0 ? response : data[0].map((header: string, index: number) => {
            if (index === 0) {
              return {
                ...this.columnCategory,
                ...this.defaultColDef,
                filter: AgGriFilter.set
              }
            } else {
            
              return {
                ...this.defaultColDef,
                headerName: header,
                field: `${index}`,
                cellDataType: this.handleType(data[1][index]),
                filter: this.handleFilterType(data[1][index]),
                
                filterParams: this.filterParams
              }
            }
          });
        }

        if(response.length === 0) {
          this.columnDefs.unshift(this.columnId);
          this.columnDefs.unshift(this.checkboxSelection);
          this.columnDefs[0].checkboxSelection = true;
        }
  
       
  
        this.columnDefExist = data.slice(1).length !== 0;
        const slice = this.columnDefExist ? 1 : 0;
        this.rowData = data.slice(slice).map(row => {
          let rowData = {
            id: row['id']
          };
  
          JSON.parse(JSON.stringify(row)).forEach((cell: any, index: number) => {
            if (index === 0) {
              rowData = { ...rowData, [`${this.columnCategory.field}`]: cell };
            } else {
              rowData = { ...rowData, [`${index}`]: cell };
            }
          });
          
          return rowData;
        });
  
      }
    }); 
  }

  getType(value: any): string {
    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    if (typeof value === 'object') {
      return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
    }

    if (typeof value === 'string') {
      const datePatterns = [
        'DD/MM/YYYY', 
        'YYYY-MM-DD',
        'YYYY/MM/DD'
      ];

      const isDateValid = datePatterns.some(pattern => {
        const date = moment(value, pattern, true);
        return date.isValid();
      });

      if (isDateValid) {
          return 'date-string';
      }

      return 'string';
    }

    return typeof value;
  }  
  
  handleType(value: any): any {
    const type = this.getType(value);
  
    switch (type) {
      case 'number':
        return 'number';
      case 'string':
        return 'text';
      case 'date-string':
        return 'dateString';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'date';
      case 'null':
      case 'undefined':
        return null;
      case 'object':
      case 'array':
      case 'function':
      case 'regexp':
      case 'set':
      case 'map':
        return 'object';
      default:
        return undefined;
    }
  }

  handleFilterType(value: any): any {
    const type = this.getType(value);
  
    switch (type) {
      case 'number':
        return AgGriFilter.number;
      case 'string':
        return AgGriFilter.text;
      case 'date-string':
        return AgGriFilter.date;
      case 'boolean':
        return AgGriFilter.set;
      case 'date':
        return AgGriFilter.date;
      case 'null':
      case 'undefined':
        return null;
      case 'object':
      case 'array':
      case 'function':
      case 'regexp':
      case 'set':
      case 'map':
        return AgGriFilter.set;
      default:
        return AgGriFilter.text;
    }
  }

  saveDataToDB(data: any[]) {

    const result: any[] = [];
    data.forEach((element, index) => {
      if (index === 0 && this.columnDefExist === false) {
        element.unshift('Category');
      } else {
        element.unshift(this.categories[0]);
      }

      const dataMap: any[] = [];
      element.forEach((value: string) => {
        dataMap.push(this.convertStringDateToDate(value));
      });

      result.push(dataMap)
    });

    this.excelService.saveData(result).subscribe();
  }

  convertStringDateToDate(dateString: string) {
    if (!dateString) return dateString;

    if (typeof dateString !== 'string') return dateString;

    // Expression régulière pour vérifier le format DD/MM/YYYY
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
      return dateString; // La chaîne n'est pas au format attendu
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);

    const date = new Date(year, month, day);

    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return dateString;
    }

    return moment(date).startOf('day').format('DD/MM/YYYY');
  }

  loadDataFromDB() {
    this.excelService.getData().subscribe(data => {
      if (data.length > 0) {
        this.rowdata = data;
        this.processData(data);
      }
    });
  }

  onToggleColumns($event: MatButtonToggleChange) {
    this.filteredColumns = this.columnDefs
      .map(col => {
        if (col.field === $event.value) {
          col.hide = !$event.source.checked
        }

        return col;
      })
      .filter(col => {

        return !col.hide
      })

    this.gridApi.setGridOption("columnDefs", this.filteredColumns);
  }

  save() {
    this.loadingSave = true;

    const newDataFilter: any[] = [];

    /* this.gridApi.getAllGridColumns().forEach(item => {
      console.log(item)
      newDataFilter.push(JSON.stringify(item.getColDef));
    }) */

    const rowsData: any[] = [];
    this.gridApi.forEachNode(node => {
      rowsData.push(node.data)
    });

    
    const newData: any[] = [];
    this.rowdata.slice(1).forEach((data: any, index: any) => {
      const findValue = rowsData.find(row => row.id === data.id)
      const newDataArray: any[] = lodash.values(findValue);

      data.forEach( (d: any, index: any) => {
        data[index] = newDataArray[index]
      })

      newData.push(data);
    })
    
    this.excelService.updateData(newData).subscribe(() => this.loadingSave = false);
    this.excelService.saveDataFilter(JSON.stringify(this.columnDefs)).subscribe(() => this.loadingSave = false);
  }
}
