import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { paramGroup, NgxFormGroup } from 'ngx-param-control';
import { MatOption, MatSelect } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
    imports: [
        RouterOutlet,
        MatSelect,
        MatOption,
        ReactiveFormsModule,
        NgTemplateOutlet,
        NgxFormGroup,
        MatTooltip
    ],
    encapsulation: ViewEncapsulation.None
})
export class App {
    protected title = 'ngx-form-param';

    public years = (() => {
        const years: number[] = [];

        const startYear = new Date().getFullYear();
        for (let i = 0; i < 4; i++) {
            years.push(startYear - i);
        }

        return years;
    })();

    public months = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'
        .split(/,/g)
        .map((label, index) => ({
            label,
            index
        }));
    public monthsOptions = [3, 6, 9, 12];
    public teamsOptions = ['Database', 'Middleware', 'UI'];

    public params = paramGroup({
        startMonth: {
            type: 'number',
            default: new Date().getMonth()
        },
        startYear: {
            type: 'number',
            default: new Date().getFullYear()
        },
        numMonths: {
            type: 'number',
            default: 6
        },
        teams: {
            type: 'string',
            array: true,
            default: ['Database', 'Middleware']
        }
    });

    constructor() {
        this.params.formGroup.valueChanges.subscribe((change) => {
            console.log(change);
        });
    }
}
