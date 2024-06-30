import { Component, forwardRef } from "@angular/core";
import { IToolPanelParams, IRowNode } from "@ag-grid-community/core";
import { IToolPanelAngularComp } from "@ag-grid-community/angular";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import {MatExpansionModule} from '@angular/material/expansion';
import * as lodash from 'lodash';

import { MatSort, MatSortModule } from '@angular/material/sort';
import {
    MatColumnDef,
    MatHeaderRowDef,
    MatNoDataRow,
    MatRowDef,
    MatTable,
    MatTableDataSource,
    MatTableModule,
} from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

interface DailyData {
    date: Date; // Date object
    amount: number;
}

interface MonthlySummary {
    date?: Date,
    month: string; // Format 'YYYY-MM'
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    potentialSavings: number;
}

export interface CustomStatsToolPanelParams extends IToolPanelParams {
    title: string;
}


@Component({
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        MatButtonModule,
        MatSortModule,
        MatExpansionModule,
        MatTableModule
    ],
    template: `
      <div *ngIf="columnDefs">
        <span>
                <h1 style="text-align: center; margin-top: 15px;"><i class="fa fa-calculator"></i> {{ title }}</h1>
                <hr>

                <mat-accordion>
                    <mat-expansion-panel hideToggle>

                        <mat-expansion-panel-header>
                            <mat-panel-title> Computed Balance </mat-panel-title>
                            <mat-panel-description></mat-panel-description>
                        </mat-expansion-panel-header>

                        <dl style="font-size: large;">
                            <dt class="totalStyle">  

                            <div ref="eWrapper" class="ag-wrapper ag-input-wrapper ag-text-field-input-wrapper" role="presentation">
                                <select [(ngModel)]="amountColumnValue" class="ag-input-field-input ag-text-field-input custom-input">
                                    <option [ngValue]="''"> Please select an amount column... </option>
                                    <option *ngFor="let col of columnDefs" [ngValue]="col.field"> {{ col.headerName }}</option>
                                </select>
                            </div>


                                <button (click)="computedBalance()"> Computed </button>
                            </dt>
                            <ng-container *ngIf="computedBalanceValue">
                                <dt class="totalStyle">total income: <b>{{ computedBalanceValue.totalIncome | currency:'EUR' }}</b></dt>
                                <dt class="totalStyle">total expenses: <b>{{ computedBalanceValue.totalExpenses | currency:'EUR' }}</b></dt>
                                <dt class="totalStyle">final balance: <b>{{ computedBalanceValue.finalBalance | currency:'EUR' }}</b></dt>
                            </ng-container>
                            
                        </dl>

                    </mat-expansion-panel>

                    <mat-expansion-panel hideToggle>

                        <mat-expansion-panel-header>
                            <mat-panel-title> Aggregate Monthly </mat-panel-title>
                            <mat-panel-description></mat-panel-description>
                        </mat-expansion-panel-header>
                    
                        <dl style="font-size: large;">
                            <dt class="totalStyle">  
                                <div ref="eWrapper" class="ag-wrapper ag-input-wrapper ag-text-field-input-wrapper" role="presentation">
                                    <select [(ngModel)]="amountColumnValue" class="ag-input-field-input ag-text-field-input custom-input">
                                        <option [ngValue]="''"> Please select an amount column... </option>
                                        <option *ngFor="let col of columnDefs" [ngValue]="col.field"> {{ col.headerName }}</option>
                                    </select>
                                </div>

                                <div ref="eWrapper" class="ag-wrapper ag-input-wrapper ag-text-field-input-wrapper" role="presentation">
                                    <select [(ngModel)]="dateColumnValue" class="ag-input-field-input ag-text-field-input custom-input">
                                        <option [ngValue]="''"> Please select a date column... </option>
                                        <option *ngFor="let col of columnDefs" [ngValue]="col.field"> {{ col.headerName }}</option>
                                    </select>
                                </div>

                                <button (click)="aggregateMonthly()"> Computed </button>
                            </dt>

                            <dt class="totalStyle calculate-average-container" 
                                style="margin-bottom: 30px;display: flex;width: 100%;justify-content: space-around;align-items: flex-end;"
                                *ngIf="aggregateMonthlyValues.length > 0">
                                <div>
                                    <h4 style="margin-top: 15px; margin-bottom: 0;"> Calculate Average Expenses </h4>
                                    <span> {{ calculateAverageExpenses(aggregateMonthlyValues) | currency:'EUR'}} </span>
                                </div>
                                
                                <div>
                                    <h4 style="margin-top: 15px; margin-bottom: 0;" > Calculate Average Incomes </h4>
                                    <span> {{ calculateAverageIncomes(aggregateMonthlyValues) | currency:'EUR'}} </span>
                                </div>
                            </dt>

                            <div class="aggregate-monthly-container" 
                                    *ngIf="aggregateMonthlyValues.length > 0">
                                <div class="header" style="flex-wrap: no-wrap; display: flex;width: 100%;justify-content: space-around;align-items: flex-end;">
                                    <dt class="totalStyle">Month</dt>
                                    <dt class="totalStyle">total income</dt>
                                    <dt class="totalStyle">total expenses</dt>
                                    <dt class="totalStyle">Balance</dt>
                                    <dt class="totalStyle">potential savings</dt>
                                </div>
                                <div *ngFor="let values of aggregateMonthlyValues">
                                    <div class="body" style="flex-wrap: no-wrap; display: flex;width: 100%;justify-content: space-around;align-items: flex-end;">
                                        <dt class="totalStyle">{{ values.date | date: 'MMM yyyy' }}</dt>
                                        <dt class="totalStyle">{{ values.totalIncome | currency:'EUR'}}</dt>
                                        <dt class="totalStyle">{{ values.totalExpenses | currency:'EUR' }}</dt>
                                        <dt class="totalStyle">{{ values.balance | currency:'EUR' }}</dt>
                                        <dt class="totalStyle">{{ values.potentialSavings | currency:'EUR' }}</dt>
                                    </div>
                                </div>
                            </div>
                        </dl>

                    </mat-expansion-panel>

                    <mat-expansion-panel hideToggle>

                        <mat-expansion-panel-header>
                            <mat-panel-title> Redundant Amount Detection  </mat-panel-title>
                            <mat-panel-description></mat-panel-description>
                        </mat-expansion-panel-header>

                        <dl style="font-size: large;">
                            <dt class="totalStyle">  
                                <div ref="eWrapper" class="ag-wrapper ag-input-wrapper ag-text-field-input-wrapper" role="presentation">
                                    <select [(ngModel)]="amountColumnValue" class="ag-input-field-input ag-text-field-input custom-input">
                                        <option [ngValue]="''"> Please select an amount column... </option>
                                        <option *ngFor="let col of columnDefs" [ngValue]="col.field"> {{ col.headerName }}</option>
                                    </select>
                                </div>

                                <button (click)="redundantAmountDetection()"> Computed </button>

                                <ng-container *ngFor="let rowGroup of redundantAmountList; let index = index">
                                    <dt class="total-style" *ngIf="rowGroup.length > 2"> 
                                        <mat-expansion-panel hideToggle>

                                            <mat-expansion-panel-header>
                                                <mat-panel-title> {{ rowGroup.length }} redundance(s) of {{ redundantAmount[index] }} </mat-panel-title>
                                                <mat-panel-description></mat-panel-description>
                                            </mat-expansion-panel-header>

                                            <div> 
                                          
                                            <div class="row-container">
                                                <div *ngFor="let row of rowGroup" class="row-item">
                                                    <div *ngFor="let key of getObjectKeys(row); let last = last" class="row-key"> 
                                                        <div *ngIf="row[key]">{{ row[key] }}<span *ngIf="!last" class="separator"> | </span> </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        </mat-expansion-panel>

                                    </dt>
                                </ng-container>
                            </dt>

                        </dl>

                    </mat-expansion-panel>

                </mat-accordion>
            </span>
      </div>`,
    styles: [`
    :host {
        width: 100%;
    }
    .mat-expansion-panel {
    background: var(--ag-header-background-color);
    color: white;

    .header, .body {
        dt {
            width: 20%;
            text-wrap: nowrap;
        }
    }

    .custom-input, button {
        font-size: 14px;
        line-height: inherit;
        color: inherit;
        font-family: inherit;
        border: var(--ag-borders-input) var(--ag-input-border-color);

        padding: 4px;
        min-height: calc(var(--ag-grid-size)* 4);
        border-radius: var(--ag-border-radius);
        margin: 4px;
    }

    button {
        background: var(--ag-header-background-color);
        padding: 8px;
    }

    mat-panel-title {
        color: white;
    }

    .mat-expansion-indicator::after{
        background-color: white;
        color: white !important;
    }
}

.mat-expansion-panel-header-title, .mat-expansion-panel-header-description {
    display: flex;
    flex-grow: 1;
    flex-basis: 0;
    margin-right: 16px;
    align-items: center;
    text-wrap: nowrap;
}

.mat-expansion-panel-body {
    padding: 0 24px 16px;
    height: calc(100vh - 170px);
    overflow: auto;
}

        .totalStyle {
            padding-bottom: 15px;
            text-align:left;
        }

        .total-style {
            margin-top: 10px;
            padding: 5px;
            border-radius: 5px;
            margin-bottom: 10px;
            background-color: var(--ag-background-color);
            border: var(--ag-borders) var(--ag-border-color);
            color: white;

    .row-group-length {
        font-weight: bold;
        font-size: 1.2em;
        color: white;
        margin-bottom: 10px;
    }

    .row-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .row-item {
        background: var(--ag-header-background-color);
        color: white;
        padding: 10px;
        border: var(--ag-borders) var(--ag-border-color);
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        overflow: auto;


        .row-key {
            font-size: 0.9em;
            color: white;
            margin: 2px 0;
            flex: none;

            > div {
                display: flex;
            }
            
            .separator {
                color: #999;
                margin: 0 5px;
            }
        }
    }
}

    `]
})
export class CustomStatsToolPanel implements IToolPanelAngularComp {
    private params!: CustomStatsToolPanelParams;

    title!: string;

    totalIncome: number = 0;
    finalBalance: number = 0;
    totalExpenses: number = 0;

    allDisplayedColumns: any;

    columnDefs: any;
    dateColumnValue: any;
    amountColumnValue: any;
    aggregateMonthlyValues: MonthlySummary[] = [];
    redundantAmount: any[] = [];
    computedBalanceValue: { totalIncome: number; totalExpenses: number; finalBalance: number; } | undefined;
    redundantAmountList: any[] = [];

    agInit(params: CustomStatsToolPanelParams): void {
        this.params = params;
        this.title = params.title;

        this.params.api.addEventListener('modelUpdated', this.setOptionsAllDisplayedColumns.bind(this));
    }

    setOptionsAllDisplayedColumns() {
        this.columnDefs = this.params.api.getColumnDefs();
    }

    computedBalance(): void {
        if (this.amountColumnValue) {
            let totalIncome = 0;
            let totalExpenses = 0;

            // Iterate through each row node
            this.params.api.forEachNode((rowNode: IRowNode) => {
                if (rowNode.displayed) {
                    const data = rowNode.data;
                    const amount = parseInt(data[this.amountColumnValue]);

                    // Check if the parsed amount is a valid number
                    if (!isNaN(amount)) {
                        if (amount > 0) {
                            totalIncome += amount;
                        } else if (amount < 0) {
                            totalExpenses += amount;
                        } else {
                            console.log(`Zero amount encountered: ${amount}`);
                        }
                    } else {
                        console.error(`Invalid amount encountered: ${data[this.amountColumnValue]}`);
                    }
                }
            });

            this.computedBalanceValue = {
                totalIncome: totalIncome,
                totalExpenses: Math.abs(totalExpenses),
                finalBalance: totalIncome + totalExpenses,
            }

        }
    }

    redundantAmountDetection(): void {
        this.redundantAmount = [];
        this.redundantAmountList = [];

        const amountOccurrences: { [key: string]: IRowNode[] } = {};

        this.params.api.forEachNode((rowNode: IRowNode) => {
            if (rowNode.displayed) {
                const amount = rowNode.data[this.amountColumnValue];
                
                
            

                if (amount !== undefined) {
                    if (amountOccurrences[amount]) {
                        amountOccurrences[amount].push(rowNode.data);
                    } else {
                        amountOccurrences[amount] = [rowNode.data];
                    }
                }
            }
        });


        for (const amount in amountOccurrences) {
            if (amountOccurrences[amount].length > 1) {
                this.redundantAmount.push(amount)
                this.redundantAmountList.push(amountOccurrences[amount]);
            }
        }

    }

    aggregateMonthly() {
        const summaryMap: { [key: string]: MonthlySummary } = {};

        this.params.api.forEachNode((rowNode: IRowNode) => {
            if (rowNode.displayed) {
                const data = rowNode.data;

                const dateValue: Date = this.isValidDate(data[this.dateColumnValue]);

                const amountValue: number = (data[this.amountColumnValue] as number);

                const year = dateValue.getFullYear();
                const month = dateValue.getMonth() + 1; // Les mois en JS sont indexés de 0 à 11
                const key = `${year} - ${month.toString().padStart(2, '0')}`;

                if (!summaryMap[key]) {
                    summaryMap[key] = {
                        date: dateValue,
                        month: key,
                        totalIncome: 0,
                        totalExpenses: 0,
                        balance: 0,
                        potentialSavings: 0
                    };
                }

                if (amountValue >= 0) {
                    summaryMap[key].totalIncome += amountValue;
                } else {
                    summaryMap[key].totalExpenses += -amountValue;
                }

                summaryMap[key].balance += amountValue;
                summaryMap[key].potentialSavings = Math.max(0, summaryMap[key].balance);
            }

        });

        this.aggregateMonthlyValues = Object.values(summaryMap);
    }

    isValidDate(dateString: string): Date | any {
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

        return date;
    }


    calculateAverageExpenses(summary: MonthlySummary[]): number {
        const totalExpenses = summary.reduce((total, entry) => total + entry.totalExpenses, 0);
        return totalExpenses / summary.length;
    }

    calculateAverageIncomes(summary: MonthlySummary[]): number {
        const totalIncomes = summary.reduce((total, entry) => total + entry.totalIncome, 0);
        return totalIncomes / summary.length;
    }

    identifyHighExpenseMonths(summary: MonthlySummary[], threshold: number): string[] {
        return summary.filter(entry => entry.totalExpenses > threshold).map(entry => entry.month);
    }

    trackSavingsGoals(summary: MonthlySummary[], monthlyGoal: number): { month: string, savings: number, goalAchieved: boolean }[] {
        return summary.map(entry => {
            return {
                month: entry.month,
                savings: entry.potentialSavings,
                goalAchieved: entry.potentialSavings >= monthlyGoal
            };
        });
    }

    getObjectKeys(obj: { [key: string]: any }): string[] {
        return Object.keys(obj);
    }

    refresh(): void { }
}