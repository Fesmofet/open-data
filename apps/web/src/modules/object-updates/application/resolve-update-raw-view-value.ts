import type { ObjectUpdateFeedItemView } from './dto/object-updates-feed.dto';

export function resolveUpdateRawViewValue(
  item: Pick<ObjectUpdateFeedItemView, 'value_json' | 'value_geo'>,
): unknown | null {
  if (item.value_json != null) {
    return item.value_json;
  }
  if (item.value_geo != null) {
    return item.value_geo;
  }
  return null;
}
