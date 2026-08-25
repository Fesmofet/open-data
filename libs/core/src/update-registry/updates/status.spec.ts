import { OBJECT_STATUS_VALUES as DB_OBJECT_STATUS_VALUES } from '@opden-data-layer/odl-db-types';
import {
  mapStatusUpdateTitleToCoreStatus,
  OBJECT_STATUS_VALUES,
  STATUS_UPDATE_TITLE_VALUES,
  UPDATE_STATUS_SCHEMA,
} from './status';

describe('OBJECT_STATUS_VALUES', () => {
  it('matches odl-db-types (single source of truth)', () => {
    expect([...OBJECT_STATUS_VALUES]).toEqual([...DB_OBJECT_STATUS_VALUES]);
  });

  it('does not include protected (core/DB status only)', () => {
    expect(OBJECT_STATUS_VALUES).not.toContain('protected');
  });
});

describe('STATUS_UPDATE_TITLE_VALUES', () => {
  it('includes protected and all core statuses', () => {
    expect(STATUS_UPDATE_TITLE_VALUES).toContain('protected');
    for (const status of OBJECT_STATUS_VALUES) {
      expect(STATUS_UPDATE_TITLE_VALUES).toContain(status);
    }
  });
});

describe('mapStatusUpdateTitleToCoreStatus', () => {
  it('maps protected and active to core active', () => {
    expect(mapStatusUpdateTitleToCoreStatus('protected')).toBe('active');
    expect(mapStatusUpdateTitleToCoreStatus('active')).toBe('active');
  });

  it('maps other titles to the same core value', () => {
    expect(mapStatusUpdateTitleToCoreStatus('unavailable')).toBe('unavailable');
    expect(mapStatusUpdateTitleToCoreStatus('closed')).toBe('closed');
    expect(mapStatusUpdateTitleToCoreStatus('relisted')).toBe('relisted');
  });
});

describe('UPDATE_STATUS_SCHEMA', () => {
  it('accepts protected without link', () => {
    const result = UPDATE_STATUS_SCHEMA.safeParse({ title: 'protected' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('protected');
    }
  });

  it('accepts relisted with non-empty link', () => {
    const result = UPDATE_STATUS_SCHEMA.safeParse({
      title: 'relisted',
      link: 'target-object-id',
    });
    expect(result.success).toBe(true);
  });

  it('rejects relisted without link', () => {
    expect(
      UPDATE_STATUS_SCHEMA.safeParse({ title: 'relisted' }).success,
    ).toBe(false);
    expect(
      UPDATE_STATUS_SCHEMA.safeParse({ title: 'relisted', link: '' }).success,
    ).toBe(false);
    expect(
      UPDATE_STATUS_SCHEMA.safeParse({ title: 'relisted', link: '   ' }).success,
    ).toBe(false);
  });

  it('accepts non-relisted statuses without link', () => {
    for (const title of [
      'active',
      'protected',
      'unavailable',
      'closed',
      'privacy_erasure',
      'nsfw',
      'flagged',
    ] as const) {
      expect(
        UPDATE_STATUS_SCHEMA.safeParse({ title }).success,
      ).toBe(true);
    }
  });
});
