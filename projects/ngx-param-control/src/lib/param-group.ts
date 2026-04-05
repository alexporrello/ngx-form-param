import { FormGroup } from '@angular/forms';

import { ParamGroupConfig } from './types';
import { paramControl } from './param-control';

/**
 * Creates a `FormGroup` where each control is wired to its own URL query param.
 *
 * **Must be called inside an Angular injection context.**
 *
 * @param config  A map of `{ controlName: ParamGroupEntry }`.
 *
 * @example
 * readonly filters = paramGroup({
 *   search: { paramName: 'q',    serializer: SERIALIZERS.string, defaultValue: '' },
 *   page:   { paramName: 'page', serializer: SERIALIZERS.number, defaultValue: 1  },
 *   active: { paramName: 'active', serializer: SERIALIZERS.boolean, defaultValue: true },
 * });
 *
 * // Template usage:
 * <input [formControl]="filters.controls.search" />
 */
export function paramGroup<K extends string>(
  config: ParamGroupConfig<K>,
): FormGroup {
  const controls: Record<string, ReturnType<typeof paramControl>> = {};

  for (const controlName of Object.keys(config) as K[]) {
    const { paramName, ...options } = config[controlName];
    controls[controlName] = paramControl(paramName, options);
  }

  return new FormGroup(controls);
}
