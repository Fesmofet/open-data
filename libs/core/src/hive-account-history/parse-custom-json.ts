import { CUSTOM_JSON_ACTION, CUSTOM_JSON_ID } from './operation-types';

export type ParsedCustomJsonOp =
  | { kind: 'reblog'; author: string; permlink: string; account: string }
  | {
      kind: 'follow';
      follower: string;
      following: string;
      what: 'blog' | 'ignore' | 'unfollow';
    }
  | {
      kind: 'follow_object';
      objectName: string;
      objectPermlink: string;
      objectType: string;
      isFollow: boolean;
    }
  | { kind: 'unparsed' };

function parseJsonArray(json: string): unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Parses known Waivio/Hive custom_json payloads from account history.
 */
export function parseCustomJsonOp(
  id: string,
  json: string,
): ParsedCustomJsonOp {
  const parts = parseJsonArray(json);
  if (!parts || parts.length < 2) {
    return { kind: 'unparsed' };
  }

  const actionType = asString(parts[0]);
  const details = asRecord(parts[1]);
  if (!details) {
    return { kind: 'unparsed' };
  }

  if (actionType === CUSTOM_JSON_ACTION.REBLOG) {
    return {
      kind: 'reblog',
      author: asString(details['author']),
      permlink: asString(details['permlink']),
      account: asString(details['account']),
    };
  }

  if (id === CUSTOM_JSON_ID.FOLLOW_WOBJECT || id === CUSTOM_JSON_ID.UNFOLLOW_WOBJECT) {
    const typeOp = asString(details['type_operation']);
    return {
      kind: 'follow_object',
      objectName: asString(details['object_name']),
      objectPermlink: asString(details['author_permlink']),
      objectType: asString(details['object_type']),
      isFollow: typeOp === CUSTOM_JSON_ACTION.FOLLOW_WOBJECT,
    };
  }

  if (id === CUSTOM_JSON_ID.FOLLOW && actionType === CUSTOM_JSON_ACTION.FOLLOW) {
    const whatRaw = Array.isArray(details['what'])
      ? details['what'][0]
      : details['what'];
    const whatStr = asString(whatRaw);
    let what: 'blog' | 'ignore' | 'unfollow' = 'unfollow';
    if (whatStr === 'blog') {
      what = 'blog';
    } else if (whatStr === 'ignore') {
      what = 'ignore';
    }
    return {
      kind: 'follow',
      follower: asString(details['follower']),
      following: asString(details['following']),
      what,
    };
  }

  return { kind: 'unparsed' };
}
