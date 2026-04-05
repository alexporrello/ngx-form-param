import { inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { debounceTime, Subscription, take } from 'rxjs';

type ParamType = 'string' | 'number' | 'boolean';

type InferParamType<T extends ParamType> = T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : string;

type Param =
    | { type: 'string'; array?: false; default?: string }
    | { type: 'number'; array?: false; default?: number }
    | { type: 'boolean'; array?: false; default?: boolean }
    | { type: 'string'; array: true; default?: string[] }
    | { type: 'number'; array: true; default?: number[] }
    | { type: 'boolean'; array: true; default?: boolean[] };

type InferParam<T extends Param> = T extends {
    array: true;
    type: infer TType extends ParamType;
}
    ? Array<InferParamType<TType>>
    : T extends { type: infer TType extends ParamType }
      ? InferParamType<TType>
      : never;

type InferFormControls<TConfig extends Record<string, Param>> = {
    [K in keyof TConfig]: FormControl<InferParam<TConfig[K]> | null>;
};

type InferSignals<TConfig extends Record<string, Param>> = {
    [K in keyof TConfig]: WritableSignal<InferParam<TConfig[K]> | null>;
};

export function paramGroup<const TConfig extends Record<string, Param>>(
    config: TConfig
): {
    formGroup: FormGroup<InferFormControls<TConfig>>;
    signals: InferSignals<TConfig>;
    subscriptions: Subscription;
} {
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

    const route = inject(ActivatedRoute);
    const router = inject(Router);

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
                signals[key].update(() => value);
                const conf = config[key];
                queryParams[key] =
                    value === (conf?.default ?? null) ? null : value;
            });
            router.navigate([], {
                queryParams,
                queryParamsHandling: 'merge',
                replaceUrl: true,
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
        default:
            return val;
    }
}
