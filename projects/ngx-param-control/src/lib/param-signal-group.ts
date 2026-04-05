import { WritableSignal } from '@angular/core';

import { ParamGroupConfig } from './types';
import { paramSignal } from './param-signal';

/**
 * Creates a plain object where each property is a `WritableSignal<T | null>`
 * wired to its own URL query parameter.
 *
 * **Must be called inside an Angular injection context.**
 *
 * This is the signals-based counterpart to `paramGroup()`.
 *
 * @param config  A map of `{ signalName: ParamGroupEntry }`.
 *
 * @example
 * readonly filters = paramSignalGroup({
 *   search: { paramName: 'q',      serializer: SERIALIZERS.string,  defaultValue: '' },
 *   page:   { paramName: 'page',   serializer: SERIALIZERS.number,  defaultValue: 1  },
 *   active: { paramName: 'active', serializer: SERIALIZERS.boolean, defaultValue: true },
 * });
 *
 * // Template usage (Angular 17+ control flow)
 * {{ filters.search() }}
 * {{ filters.page() }}
 *
 * // Updating a value (also updates the URL)
 * this.filters.page.set(2);
 */
export function paramSignalGroup<K extends string>(
  config: ParamGroupConfig<K>,
): { [key in K]: WritableSignal<unknown> } {
  const signals = {} as { [key in K]: WritableSignal<unknown> };

  for (const controlName of Object.keys(config) as K[]) {
    const { paramName, ...options } = config[controlName];
    signals[controlName] = paramSignal(paramName, options);
  }

  return signals;
}
