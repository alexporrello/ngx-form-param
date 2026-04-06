import { WritableSignal } from '@angular/core';
import { FormControl } from '@angular/forms';

export type ParamType = 'string' | 'number' | 'boolean' | 'date';

export type InferParamType<T extends ParamType> = T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : T extends 'date'
        ? Date
        : string;

export type ParamRaw<
    TType extends ParamType,
    TArray extends Boolean | undefined,
    TDefault
> = {
    type: TType;
    array?: TArray;
    default?: TDefault;
    debounceMs?: number;
};

export type Param =
    | ParamRaw<'string', false, string>
    | ParamRaw<'number', false, number>
    | ParamRaw<'boolean', false, boolean>
    | ParamRaw<'string', true, string[]>
    | ParamRaw<'number', true, number[]>
    | ParamRaw<'boolean', true, boolean[]>;

export type InferParam<T extends Param> = T extends {
    array: true;
    type: infer TType extends ParamType;
}
    ? Array<InferParamType<TType>>
    : T extends { type: infer TType extends ParamType }
      ? InferParamType<TType>
      : never;

export type InferFormControls<TConfig extends Record<string, Param>> = {
    [K in keyof TConfig]: FormControl<InferParam<TConfig[K]> | null>;
};

export type InferSignals<TConfig extends Record<string, Param>> = {
    [K in keyof TConfig]: WritableSignal<InferParam<TConfig[K]> | null>;
};
