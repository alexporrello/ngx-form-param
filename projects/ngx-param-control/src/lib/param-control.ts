import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ParamControlOptions } from './types';
import { STRING_SERIALIZER } from './serializers';

/**
 * Creates a `FormControl<T | null>` whose value is kept in two-way sync with a
 * URL query parameter.
 *
 * **Must be called inside an Angular injection context** (e.g. a component class
 * field initializer or constructor, or inside `runInInjectionContext`).
 *
 * Control → URL sync is debounced (default 300 ms).
 * URL → Control sync is immediate.
 *
 * @param paramName  The URL query-param key, e.g. `'page'`.
 * @param options    Optional configuration (serializer, default value, etc.).
 *
 * @example
 * // In a standalone component
 * readonly page = paramControl('page', {
 *   serializer: SERIALIZERS.number,
 *   defaultValue: 1,
 * });
 */
export function paramControl<T = string>(
  paramName: string,
  options: ParamControlOptions<T> = {},
): FormControl<T | null> {
  const {
    defaultValue,
    serializer = STRING_SERIALIZER as unknown as typeof options.serializer,
    debounceMs = 300,
    pushState = false,
  } = options;

  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // ── Determine initial value ──────────────────────────────────────────────
  const snapshot = route.snapshot.queryParamMap;
  const rawInitial = snapshot.get(paramName);
  const initialValue: T | null =
    rawInitial != null
      ? serializer!.deserialize(rawInitial)
      : (defaultValue ?? null);

  const control = new FormControl<T | null>(initialValue);

  // ── URL → Control ────────────────────────────────────────────────────────
  // Always active (including SSR — ActivatedRoute works server-side).
  route.queryParamMap
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((params) => {
      const raw = params.get(paramName);
      const value: T | null =
        raw != null ? serializer!.deserialize(raw) : (defaultValue ?? null);

      // Use JSON comparison to handle object/array default values gracefully.
      const isSame =
        JSON.stringify(control.value) === JSON.stringify(value);
      if (!isSame) {
        control.setValue(value, { emitEvent: false });
      }
    });

  // ── Control → URL ────────────────────────────────────────────────────────
  // Skip on SSR: Router.navigate performs DOM operations on some platforms.
  if (isBrowser) {
    control.valueChanges
      .pipe(
        debounceTime(debounceMs),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((value) => {
        const isDefault =
          JSON.stringify(value) === JSON.stringify(defaultValue ?? null);

        const queryParams: Record<string, string | null> = {
          [paramName]: isDefault ? null : serializer!.serialize(value as T),
        };

        router.navigate([], {
          relativeTo: route,
          queryParams,
          queryParamsHandling: 'merge',
          replaceUrl: !pushState,
        });
      });
  }

  return control;
}
