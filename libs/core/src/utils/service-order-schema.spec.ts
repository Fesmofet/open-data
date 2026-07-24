import {
  emptyValueFromServiceOrderSchema,
  sanitizeServiceOrderSchema,
  serviceOrderSchemaFromOfferTerms,
  validateServiceOrderSchema,
} from './service-order-schema';

describe('sanitizeServiceOrderSchema', () => {
  it('keeps allowed object schema with properties', () => {
    const schema = {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          description: 'Product id',
        },
      },
    };
    expect(sanitizeServiceOrderSchema(schema)).toEqual(schema);
  });

  it('drops dangerous property keys', () => {
    const schema = {
      type: 'object',
      properties: {
        __proto__: { type: 'string' },
        ok: { type: 'string' },
      },
    };
    const sanitized = sanitizeServiceOrderSchema(schema);
    expect(sanitized?.['properties']).toEqual({ ok: { type: 'string' } });
  });
});

describe('serviceOrderSchemaFromOfferTerms', () => {
  it('reads serviceOrderSchema from terms', () => {
    const schema = {
      type: 'object',
      properties: { id: { type: 'string' } },
    };
    expect(
      serviceOrderSchemaFromOfferTerms({ serviceOrderSchema: schema }),
    ).toEqual(schema);
  });
});

describe('emptyValueFromServiceOrderSchema', () => {
  it('builds empty values by type', () => {
    const schema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        count: { type: 'number' },
        meta: {
          type: 'object',
          properties: { featured: { type: 'boolean' } },
        },
      },
    };
    expect(emptyValueFromServiceOrderSchema(schema)).toEqual({
      id: '',
      count: 0,
      meta: { featured: false },
    });
  });
});

describe('validateServiceOrderSchema', () => {
  it('flags duplicate property names', () => {
    const issues = validateServiceOrderSchema({
      type: 'object',
      properties: {
        Foo: { type: 'string' },
        foo: { type: 'string' },
      },
    });
    expect(issues.some((i) => i.code === 'duplicate_key')).toBe(true);
  });
});
