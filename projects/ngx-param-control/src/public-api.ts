/*
 * Public API Surface of ngx-param-control
 */

// Types
export type {
  ParamSerializer,
  ParamControlOptions,
  ParamGroupEntry,
  ParamGroupConfig,
} from './lib/types';

// Built-in serializers
export {
  STRING_SERIALIZER,
  NUMBER_SERIALIZER,
  BOOLEAN_SERIALIZER,
  JSON_SERIALIZER,
  SERIALIZERS,
} from './lib/serializers';

// Factory functions (reactive forms)
export { paramControl } from './lib/param-control';
export { paramGroup } from './lib/param-group';

// Factory functions (signals)
export { paramSignal } from './lib/param-signal';
export { paramSignalGroup } from './lib/param-signal-group';
