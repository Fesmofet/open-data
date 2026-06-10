import type { UpdateDefinition } from '@opden-data-layer/core/update-registry';
import { z, toJSONSchema } from 'zod';

function payloadField(kind: UpdateDefinition['value_kind']): string {
  if (kind === 'text' || kind === 'object_ref' || kind === 'user_ref') {
    return 'value_text';
  }
  if (kind === 'geo') return 'value_geo';
  return 'value_json';
}

export function updateTypeExamplePayload(
  valueKind: UpdateDefinition['value_kind'],
  updateType: string,
): string {
  const field = payloadField(valueKind);
  const valueExample =
    valueKind === 'text' || valueKind === 'object_ref' || valueKind === 'user_ref'
      ? valueKind === 'object_ref'
        ? '"<object_id>"'
        : valueKind === 'user_ref'
          ? '"<account_name>"'
          : '"<string>"'
      : valueKind === 'geo'
        ? '{ "latitude": <number>, "longitude": <number> }'
        : '{}  // or [] — valid JSON per schema';

  return `{
  object_id,
  update_type: '${updateType}',
  locale: 'en-US',
  ${field}: ${valueExample}
}`;
}

export function updateSchemaToJson(def: UpdateDefinition): Record<string, unknown> | null {
  if (!def.schema || !(def.schema instanceof z.ZodType)) {
    return null;
  }
  try {
    return toJSONSchema(def.schema, { reused: 'inline' }) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function updateSchemaToMarkdown(def: UpdateDefinition): string {
  const json = updateSchemaToJson(def);
  return json ? JSON.stringify(json, null, 2) : '// schema not available';
}

export function serializeUpdateType(updateType: string, def: UpdateDefinition): string {
  const schemaBlock = updateSchemaToMarkdown(def);
  const card = def.cardinality === 'multi' ? 'multi' : 'single';
  const kind = def.value_kind;
  const purposeLine = def.description || '(none)';

  return `# ${updateType}

- **Update type:** \`${updateType}\`
- **Update description:** ${purposeLine}
- **Cardinality:** ${card}
- **Payload kind:** ${kind}
- **Payload validation requirements (JSON Schema derived from Zod):**

\`\`\`json
${schemaBlock}
\`\`\`

- **Example payload for broadcast:**

\`\`\`js
[
  'custom_json',
  {
    required_auths: [],
    required_posting_auths: [account],
    id: 'odl-mainnet',
    json: JSON.stringify({
      events: [
        {
          action: 'object_update',
          v: 1,
          payload: ${updateTypeExamplePayload(kind, updateType).replace(/\n/g, '\n          ')}
        }
      ]
    }),
  },
]
\`\`\`
`;
}
