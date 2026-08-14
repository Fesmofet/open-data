import { UPDATE_REGISTRY } from '@opden-data-layer/core/update-registry';

import type { CustomJsonOp } from './hive-operations';
import { buildOdlUpdateCreateOp } from './odl-operations';

export type BuildValidatedUpdateCreateOpInput = {
  id: string;
  objectId: string;
  creator: string;
  updateType: string;
  value: unknown;
  locale?: string;
  language?: string;
};

/**
 * Registry-validated single `update_create` op for existing objects.
 */
export function buildValidatedUpdateCreateOp(
  input: BuildValidatedUpdateCreateOpInput,
): CustomJsonOp {
  const definition = UPDATE_REGISTRY[input.updateType];
  if (!definition) {
    throw new Error(`Unknown update_type: ${input.updateType}`);
  }

  const parsed = definition.schema.safeParse(input.value);
  if (!parsed.success) {
    throw new Error(
      `Invalid value for update_type "${input.updateType}": ${parsed.error.message}`,
    );
  }

  const creator = input.creator.trim().replace(/^@/, '').toLowerCase();
  const language = input.language ?? 'en-US';

  return buildOdlUpdateCreateOp({
    id: input.id,
    objectId: input.objectId.trim(),
    updateType: input.updateType,
    creator,
    valueKind: definition.value_kind,
    value: parsed.data,
    locale:
      definition.localizable === true
        ? input.locale && input.locale.length > 0
          ? input.locale
          : language
        : undefined,
    required_posting_auths: [creator],
  });
}
