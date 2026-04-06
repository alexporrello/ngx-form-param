import { inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { debounceTime, Subscription, take } from 'rxjs';

import {
    InferFormControls,
    InferParamType,
    InferSignals,
    Param,
    ParamType
} from './types';

export function paramGroup<const TConfig extends Record<string, Param>>(
    config: TConfig
): {
    formGroup: FormGroup<InferFormControls<TConfig>>;
    signals: InferSignals<TConfig>;
    subscriptions: Subscription;
} {
    const route = inject(ActivatedRoute);
    const router = inject(Router);

    const controls = Object.fromEntries(
        Object.entries(config).map(([key, conf]) => {
            return [key, new FormControl(conf.default ?? null)];
        })
    ) as InferFormControls<TConfig>;
    const formGroup = new FormGroup(controls);

    const signals = Object.fromEntries(
        Object.entries(config).map(([key, conf]) => {
            return [key, signal(conf.default ?? null)];
        })
    ) as InferSignals<TConfig>;

    const subscriptions = new Subscription();

    subscriptions.add(
        route.queryParams.subscribe((params) => {
            Object.entries(parseParams(params, config)).forEach(([k, v]) => {
                if (controls[k]) {
                    controls[k].setValue(v, { emitEvent: false });
                    signals[k].set(v);
                }
            });
        })
    );

    subscriptions.add(
        formGroup.valueChanges.pipe(debounceTime(300)).subscribe((changes) => {
            const queryParams: Record<string, any> = {};
            Object.entries(changes).forEach(([key, value]) => {
                const _config = config[key];
                if (!_config) return;

                signals[key].update(() => value);
                queryParams[key] =
                    value === (_config.default ?? null) ? null : value;
            });
            router.navigate([], {
                queryParams,
                queryParamsHandling: 'merge',
                replaceUrl: true
            });
        })
    );

    return {
        formGroup,
        signals,
        subscriptions
    };
}

function parseParams<const TConfig extends Record<string, Param>>(
    params: Params,
    config: TConfig
) {
    return Object.entries(params).reduce(
        (acc, [key, value]) => {
            const _config = config[key];

            if (!_config) return acc;

            if (_config.array) {
                // Coerce non-array values to array
                if (!Array.isArray(value)) value = [value];

                // Parse the values in the array
                acc[key] = (<any[]>value).map((v) =>
                    parseVal(_config.type, v, _config.default)
                );

                return acc;
            }

            acc[key] = parseVal(_config.type, value, _config.default);

            return acc;
        },
        {} as Record<string, any>
    );
}

function parseVal<T extends ParamType>(
    type: T,
    val: string,
    defaultVal?: InferParamType<T> | Array<InferParamType<T>>
) {
    switch (type) {
        case 'boolean':
            return val === 'true';
        case 'number':
            const asNum = parseInt(val);
            if (!isNaN(asNum)) return asNum;
            return defaultVal ?? null;
        case 'date':
            const asDate = new Date(val);
            return asDate;
        default:
            return val;
    }
}
