/** Object lifecycle status values stored on `objects_core.status`. */
export const OBJECT_STATUS_VALUES = [
  'active',
  'relisted',
  'unavailable',
  'closed',
  'privacy_erasure',
  'nsfw',
  'flagged',
] as const;

export type ObjectStatus = (typeof OBJECT_STATUS_VALUES)[number];
