import {
  STRING_SERIALIZER,
  NUMBER_SERIALIZER,
  BOOLEAN_SERIALIZER,
  JSON_SERIALIZER,
  SERIALIZERS,
} from './serializers';

// ─── STRING_SERIALIZER ────────────────────────────────────────────────────────

describe('STRING_SERIALIZER', () => {
  it('serialize returns the value unchanged', () => {
    expect(STRING_SERIALIZER.serialize('hello')).toBe('hello');
    expect(STRING_SERIALIZER.serialize('')).toBe('');
    expect(STRING_SERIALIZER.serialize('123')).toBe('123');
  });

  it('deserialize returns the raw string unchanged', () => {
    expect(STRING_SERIALIZER.deserialize('hello')).toBe('hello');
    expect(STRING_SERIALIZER.deserialize('')).toBe('');
    expect(STRING_SERIALIZER.deserialize('true')).toBe('true');
  });

  it('is a round-trip identity for arbitrary strings', () => {
    const values = ['foo', 'bar baz', 'hello world', '!@#$%^&*()'];
    for (const v of values) {
      expect(STRING_SERIALIZER.deserialize(STRING_SERIALIZER.serialize(v))).toBe(v);
    }
  });
});

// ─── NUMBER_SERIALIZER ────────────────────────────────────────────────────────

describe('NUMBER_SERIALIZER', () => {
  it('serialize converts a number to its string representation', () => {
    expect(NUMBER_SERIALIZER.serialize(42)).toBe('42');
    expect(NUMBER_SERIALIZER.serialize(0)).toBe('0');
    expect(NUMBER_SERIALIZER.serialize(-7)).toBe('-7');
    expect(NUMBER_SERIALIZER.serialize(3.14)).toBe('3.14');
  });

  it('deserialize converts a numeric string to a number', () => {
    expect(NUMBER_SERIALIZER.deserialize('42')).toBe(42);
    expect(NUMBER_SERIALIZER.deserialize('0')).toBe(0);
    expect(NUMBER_SERIALIZER.deserialize('-7')).toBe(-7);
    expect(NUMBER_SERIALIZER.deserialize('3.14')).toBeCloseTo(3.14);
  });

  it('deserialize returns 0 for non-numeric strings', () => {
    expect(NUMBER_SERIALIZER.deserialize('abc')).toBe(0);
    expect(NUMBER_SERIALIZER.deserialize('')).toBe(0);
    expect(NUMBER_SERIALIZER.deserialize('NaN')).toBe(0);
  });

  it('is a round-trip for valid numbers', () => {
    const values = [0, 1, -100, 99.99];
    for (const v of values) {
      expect(NUMBER_SERIALIZER.deserialize(NUMBER_SERIALIZER.serialize(v))).toBe(v);
    }
  });
});

// ─── BOOLEAN_SERIALIZER ───────────────────────────────────────────────────────

describe('BOOLEAN_SERIALIZER', () => {
  it('serialize converts true/false to "true"/"false"', () => {
    expect(BOOLEAN_SERIALIZER.serialize(true)).toBe('true');
    expect(BOOLEAN_SERIALIZER.serialize(false)).toBe('false');
  });

  it('deserialize returns true only for the exact string "true"', () => {
    expect(BOOLEAN_SERIALIZER.deserialize('true')).toBe(true);
    expect(BOOLEAN_SERIALIZER.deserialize('false')).toBe(false);
    expect(BOOLEAN_SERIALIZER.deserialize('1')).toBe(false);
    expect(BOOLEAN_SERIALIZER.deserialize('True')).toBe(false);
    expect(BOOLEAN_SERIALIZER.deserialize('')).toBe(false);
  });

  it('is a round-trip for both boolean values', () => {
    expect(BOOLEAN_SERIALIZER.deserialize(BOOLEAN_SERIALIZER.serialize(true))).toBe(true);
    expect(BOOLEAN_SERIALIZER.deserialize(BOOLEAN_SERIALIZER.serialize(false))).toBe(false);
  });
});

// ─── JSON_SERIALIZER ──────────────────────────────────────────────────────────

describe('JSON_SERIALIZER', () => {
  it('serialize produces valid JSON strings', () => {
    expect(JSON_SERIALIZER.serialize({ a: 1 })).toBe('{"a":1}');
    expect(JSON_SERIALIZER.serialize([1, 2, 3])).toBe('[1,2,3]');
    expect(JSON_SERIALIZER.serialize('hello')).toBe('"hello"');
    expect(JSON_SERIALIZER.serialize(null)).toBe('null');
    expect(JSON_SERIALIZER.serialize(42)).toBe('42');
  });

  it('deserialize parses valid JSON strings', () => {
    expect(JSON_SERIALIZER.deserialize('{"a":1}')).toEqual({ a: 1 });
    expect(JSON_SERIALIZER.deserialize('[1,2,3]')).toEqual([1, 2, 3]);
    expect(JSON_SERIALIZER.deserialize('"hello"')).toBe('hello');
    expect(JSON_SERIALIZER.deserialize('null')).toBeNull();
    expect(JSON_SERIALIZER.deserialize('42')).toBe(42);
  });

  it('deserialize returns null for invalid JSON', () => {
    expect(JSON_SERIALIZER.deserialize('not json')).toBeNull();
    expect(JSON_SERIALIZER.deserialize('{broken')).toBeNull();
    expect(JSON_SERIALIZER.deserialize('')).toBeNull();
  });

  it('is a round-trip for complex objects', () => {
    const obj = { page: 2, filters: ['a', 'b'], active: true };
    const serialized = JSON_SERIALIZER.serialize(obj);
    expect(JSON_SERIALIZER.deserialize(serialized as string)).toEqual(obj);
  });
});

// ─── SERIALIZERS convenience map ──────────────────────────────────────────────

describe('SERIALIZERS', () => {
  it('exposes all built-in serializers by name', () => {
    expect(SERIALIZERS.string).toBe(STRING_SERIALIZER);
    expect(SERIALIZERS.number).toBe(NUMBER_SERIALIZER);
    expect(SERIALIZERS.boolean).toBe(BOOLEAN_SERIALIZER);
    expect(SERIALIZERS.json).toBe(JSON_SERIALIZER);
  });
});
