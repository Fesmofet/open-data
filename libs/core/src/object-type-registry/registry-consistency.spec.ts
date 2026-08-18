import { OBJECT_TYPE_REGISTRY } from './object-type-registry';
import { UPDATE_REGISTRY } from '../update-registry';

describe('OBJECT_TYPE_REGISTRY consistency', () => {
  for (const [key, def] of Object.entries(OBJECT_TYPE_REGISTRY)) {
    describe(key, () => {
      it('registry key matches definition.object_type', () => {
        expect(def.object_type).toBe(key);
      });

      it('every supported_update exists in UPDATE_REGISTRY', () => {
        for (const updateType of def.supported_updates) {
          expect(UPDATE_REGISTRY[updateType]).toBeDefined();
        }
      });

      it('every supposed_update exists and is supported', () => {
        const supported = new Set(def.supported_updates);
        for (const supposed of def.supposed_updates) {
          expect(UPDATE_REGISTRY[supposed.update_type]).toBeDefined();
          expect(supported.has(supposed.update_type)).toBe(true);
        }
      });
    });
  }
});
