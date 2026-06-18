'use client';

import type { ActivityRowView } from '../../domain/types/activity-row-view';
import { ActivityRowContent } from './activity-row-content';

type ActivityRowProps = {
  row: ActivityRowView;
};

export function ActivityRow({ row }: ActivityRowProps) {
  return <ActivityRowContent row={row} />;
}
