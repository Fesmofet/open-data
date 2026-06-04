import { Readable } from 'node:stream';
import { chain } from 'stream-chain';
import streamJson from 'stream-json';

const pickFilter = require('stream-json/filters/pick.js') as (opts: {
  filter: string;
}) => import('node:stream').Duplex;
const streamArrayMod = require('stream-json/streamers/stream-array.js') as {
  asStream: (opts?: unknown) => import('node:stream').Duplex;
};

import { geoPayloadToGeoJsonPoint } from './coerce-geo-update-raw-value';
import { odlEnvelopeEventSchema } from './odl-envelope.schema';

/** Fixture from IPFS CID QmZmR7MSeXPUuDznRK8N3JEkdoVEE6jDtVJEybBDJcmrv2 (recipe publish). */
const PGX_RECIPE_BATCH_JSON = `{"events":[{"action":"object_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","object_type":"recipe","creator":"flowmaster"}},{"action":"update_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","update_type":"name","creator":"flowmaster","value_text":"Smoked Chicken Breakfast Power Bowl","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","update_type":"description","creator":"flowmaster","value_text":"A balanced and protein-rich breakfast bowl featuring tender smoked chicken breast, fluffy scrambled eggs, crispy roasted potatoes, creamy avocado, and fresh mixed greens. Finished with tangy pickled cucumbers and juicy cherry tomatoes, this wholesome dish delivers a satisfying combination of flavors, textures, and nutrients, making it an excellent choice for a healthy breakfast, brunch, or light lunch.","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","update_type":"image","creator":"flowmaster","value_json":{"cid":"QmdHhw5MsC4BNYqkpJXEfQFQ8VeNFcjPZ79mfgurCsxG3e"},"locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","update_type":"ingredients","creator":"flowmaster","value_json":["Smoked chicken breast","Scrambled eggs","Roasted baby potatoes","Avocado","Pickled cucumbers","Lettuce","Baby spinach","Cherry tomatoes","Black and white sesame seeds","Olive oil","Salt","Black pepper"],"locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","update_type":"aggregateRating","creator":"flowmaster","value_text":"Rating","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","update_type":"tagCategory","creator":"flowmaster","value_text":"Cuisine","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","update_type":"tagCategory","creator":"flowmaster","value_text":"Meal Type","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"pgx-smoked-chicken-breakfast-power-bowl","update_type":"tagCategory","creator":"flowmaster","value_text":"Diet","locale":"en-US"}}]}`;

describe('PGX recipe IPFS batch fixture', () => {
  it('parses all nine events from the published envelope', async () => {
    const pipeline = chain([
      Readable.from([PGX_RECIPE_BATCH_JSON]),
      streamJson.parser(),
      pickFilter({ filter: 'events' }),
      streamArrayMod.asStream(),
    ]);

    const actions: string[] = [];
    const ingredientsPayloads: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      pipeline.on('data', (item: { key: number; value: unknown }) => {
        const parsed = odlEnvelopeEventSchema.safeParse(item.value);
        expect(parsed.success).toBe(true);
        if (!parsed.success) {
          return;
        }
        actions.push(parsed.data.action);
        if (
          parsed.data.action === 'update_create' &&
          (parsed.data.payload as { update_type?: string }).update_type ===
            'ingredients'
        ) {
          ingredientsPayloads.push(
            (parsed.data.payload as { value_json?: unknown }).value_json,
          );
        }
      });
      pipeline.on('end', () => resolve());
      pipeline.on('error', reject);
    });

    expect(actions).toEqual([
      'object_create',
      'update_create',
      'update_create',
      'update_create',
      'update_create',
      'update_create',
      'update_create',
      'update_create',
      'update_create',
    ]);
    expect(ingredientsPayloads[0]).toEqual([
      'Smoked chicken breast',
      'Scrambled eggs',
      'Roasted baby potatoes',
      'Avocado',
      'Pickled cucumbers',
      'Lettuce',
      'Baby spinach',
      'Cherry tomatoes',
      'Black and white sesame seeds',
      'Olive oil',
      'Salt',
      'Black pepper',
    ]);
  });
});

/** Fixture from IPFS CID QmUJKiNkDrJYbNFTaSJuMLfx5usAsB6hUAfTQ3mHTPHmUA (restaurant + geo). */
const GPS_RESTAURANT_BATCH_JSON = `{"events":[{"action":"object_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","object_type":"restaurant","creator":"flowmaster"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"name","creator":"flowmaster","value_text":"Flowmaster rest 1","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"description","creator":"flowmaster","value_text":"Flowmaster rest 1","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"image","creator":"flowmaster","value_json":{"cid":"QmXuTWLbpzEBAnjujmf6T3Dm9QL21cXZ9QuRVrLDmNYnyH"},"locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"aggregateRating","creator":"flowmaster","value_text":"Ambience","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"aggregateRating","creator":"flowmaster","value_text":"Service","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"aggregateRating","creator":"flowmaster","value_text":"Food","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"aggregateRating","creator":"flowmaster","value_text":"Value","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"tagCategory","creator":"flowmaster","value_text":"Cuisine","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"tagCategory","creator":"flowmaster","value_text":"Features","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"tagCategory","creator":"flowmaster","value_text":"Good For","locale":"en-US"}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"geo","creator":"flowmaster","value_geo":{"latitude":49.774724,"longitude":35.68634}}},{"action":"update_create","v":1,"payload":{"object_id":"gps-flowmaster-rest-1","update_type":"link","creator":"flowmaster","value_json":{"type":"facebook","value":"test"},"locale":"en-US"}}]}`;

describe('GPS restaurant IPFS batch fixture', () => {
  it('parses geo at child index 11 with lat/lon payload', async () => {
    const pipeline = chain([
      Readable.from([GPS_RESTAURANT_BATCH_JSON]),
      streamJson.parser(),
      pickFilter({ filter: 'events' }),
      streamArrayMod.asStream(),
    ]);

    let childIndex = 0;
    let geoPayload: unknown;

    await new Promise<void>((resolve, reject) => {
      pipeline.on('data', (item: { key: number; value: unknown }) => {
        const parsed = odlEnvelopeEventSchema.safeParse(item.value);
        expect(parsed.success).toBe(true);
        if (parsed.success && childIndex === 11) {
          geoPayload = parsed.data.payload;
        }
        childIndex += 1;
      });
      pipeline.on('end', () => resolve());
      pipeline.on('error', reject);
    });

    expect(childIndex).toBe(13);
    expect(geoPayload).toMatchObject({
      update_type: 'geo',
      value_geo: { latitude: 49.774724, longitude: 35.68634 },
    });
    expect(geoPayloadToGeoJsonPoint((geoPayload as { value_geo: unknown }).value_geo)).toEqual({
      type: 'Point',
      coordinates: [35.68634, 49.774724],
    });
  });
});
