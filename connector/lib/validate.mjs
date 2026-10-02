// Zero-dependency JSON Schema subset validator for connector contract v1.
// Supported: type (string or array, incl. "null" and "integer"), required, properties,
// additionalProperties (boolean), items, enum, minLength, minimum, format "date-time".
// Every other keyword is ignored (see CONTRACT.md). Returns a list of messages; [] = valid.

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v; // string, number, boolean, object, undefined
}

function matchesType(t, v) {
  const actual = typeOf(v);
  if (t === 'integer') return actual === 'number' && Number.isInteger(v);
  if (t === 'number') return actual === 'number' && Number.isFinite(v);
  return actual === t;
}

export function validate(schema, value, path = '$') {
  const errs = [];
  if (!schema || typeof schema !== 'object') return errs;

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(t, value))) {
      errs.push(`${path}: expected ${types.join('|')}, got ${typeOf(value)}`);
      return errs;
    }
  }
  if (schema.enum !== undefined && !schema.enum.some((e) => e === value)) {
    errs.push(`${path}: must be one of ${JSON.stringify(schema.enum)}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errs.push(`${path}: shorter than ${schema.minLength}`);
    if (schema.format === 'date-time' && !(/^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value)))) {
      errs.push(`${path}: not an ISO 8601 date-time`);
    }
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) {
    errs.push(`${path}: below minimum ${schema.minimum}`);
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, i) => errs.push(...validate(schema.items, item, `${path}[${i}]`)));
  }
  if (typeOf(value) === 'object') {
    for (const k of schema.required || []) {
      if (value[k] === undefined) errs.push(`${path}.${k}: required`);
    }
    const props = schema.properties || {};
    for (const [k, sub] of Object.entries(props)) {
      if (value[k] !== undefined) errs.push(...validate(sub, value[k], `${path}.${k}`));
    }
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) if (!(k in props)) errs.push(`${path}.${k}: not allowed`);
    }
  }
  return errs;
}
