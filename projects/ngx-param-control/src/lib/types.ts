/**
 * Converts a typed value to/from its URL query-param string representation.
 */
export interface ParamSerializer<T> {
  serialize(value: T): string;
  deserialize(value: string): T;
}

/**
 * Options for a single `paramControl()` binding.
 */
export interface ParamControlOptions<T> {
  /**
   * The default value for this control. When the control value equals this,
   * the query param is removed from the URL to keep it clean.
   */
  defaultValue?: T;

  /**
   * Serializer used to convert the value to/from a URL string.
   * Defaults to the built-in `STRING_SERIALIZER`.
   */
  serializer?: ParamSerializer<T>;

  /**
   * Milliseconds to debounce before syncing the control value → URL.
   * Defaults to 300 ms.
   */
  debounceMs?: number;

  /**
   * When `true`, navigating will push a new history entry (`pushState`).
   * Defaults to `false` (uses `replaceUrl`).
   */
  pushState?: boolean;
}

/**
 * Configuration entry for a single control inside a `paramGroup()` call.
 * Combines the URL param name with the control's options.
 */
export interface ParamGroupEntry<T> extends ParamControlOptions<T> {
  /** The URL query-param key this control is bound to. */
  paramName: string;
}

/**
 * Configuration map passed to `paramGroup()`.
 * Keys become the `FormGroup` control names; values describe the param binding.
 */
export type ParamGroupConfig<K extends string = string> = Record<
  K,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ParamGroupEntry<any>
>;
