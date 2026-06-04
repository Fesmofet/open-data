import { Readable } from 'node:stream';
import { chain } from 'stream-chain';
import streamJson from 'stream-json';

const pickFilter = require('stream-json/filters/pick.js') as (opts: {
  filter: string;
}) => import('node:stream').Duplex;
const streamArrayMod = require('stream-json/streamers/stream-array.js') as {
  asStream: (opts?: unknown) => import('node:stream').Duplex;
};

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
