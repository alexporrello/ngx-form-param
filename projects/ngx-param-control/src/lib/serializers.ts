import { ParamSerializer } from './types';

/**
 * Identity serializer — stores the value as-is in the URL.
 */
export const STRING_SERIALIZER: ParamSerializer<string> = {
  serialize: (v) => v,
  deserialize: (v) => v,
};

/**
 * Serializer for numeric values.
 * Deserializes with `Number()`; treats `NaN` as `0`.
 */
export const NUMBER_SERIALIZER: ParamSerializer<number> = {
  serialize: (v) => String(v),
  deserialize: (v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  },
};

/**
 * Serializer for boolean values.
 * `"true"` → `true`, anything else → `false`.
 */
export const BOOLEAN_SERIALIZER: ParamSerializer<boolean> = {
  serialize: (v) => String(v),
  deserialize: (v) => v === 'true',
};

/**
 * Serializer for arbitrary JSON-serializable values.
 * Falls back to `null` if the stored string cannot be parsed.
 */
export const JSON_SERIALIZER: ParamSerializer<unknown> = {
  serialize: (v) => JSON.stringify(v),
  deserialize: (v) => {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  },
};

/**
 * Convenience map so consumers can refer to built-in serializers by name.
 *
 * @example
 * paramControl('page', { serializer: SERIALIZERS.number })
 */
export const SERIALIZERS = {
  string: STRING_SERIALIZER,
  number: NUMBER_SERIALIZER,
  boolean: BOOLEAN_SERIALIZER,
  json: JSON_SERIALIZER,
} as const;
