/**
 * In-house, dependency-free replacement for `json-ts`.
 *
 * It turns a parsed `cds.env` object into a single `export interface CDS_ENV { … }` declaration
 * built entirely from INLINE nested object literal types. Emitting one self-contained interface
 * (instead of many named child interfaces, as `json-ts` did) avoids name collisions between
 * same-named nested shapes, keeps a single export, and never leaves an unexported helper type that
 * could trip TypeScript's declaration rules.
 *
 * The function is pure (no I/O) and total: it must never throw for any value that `JSON.parse`
 * can return, so the postinstall step can rely on it after the acquisition/validation gate.
 */

const INDENT = '  ';

// A property name can be written bare only when it is a valid ECMAScript identifier; anything else
// (e.g. `_home_cds-dk`, `[dev]`, profile-ish keys) must be quoted.
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// Keys containing quotes, backslashes, control characters (a raw newline would terminate the
// string literal mid-key) or the U+2028/U+2029 line separators are delegated to `JSON.stringify`,
// which escapes them into a valid double-quoted literal.
const NEEDS_JSON_QUOTING = /[\u0000-\u001f'\\\u2028\u2029]/;

// Far beyond any real `cds.env` (~10 levels), but keeps the generator total even for adversarially
// deep JSON: V8's `JSON.parse` handles thousands of nesting levels iteratively, while this renderer
// recurses — beyond the cap the value degrades to `unknown` instead of overflowing the stack.
const MAX_DEPTH = 64;

/**
 * Narrows to a plain, non-array object. Arrays and `null` are `typeof 'object'` too, so both are
 * excluded here and handled by their own branches.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Renders a property name, quoting it when it is not a valid identifier. Single quotes match the
 * repository style; the `JSON.stringify` fallback keeps the output valid for any key that contains
 * a quote, a backslash, or a character that may not appear raw inside a string literal.
 */
function formatKey(key: string): string {
  if (IDENTIFIER_PATTERN.test(key)) {
    return key;
  }

  if (NEEDS_JSON_QUOTING.test(key)) {
    return JSON.stringify(key);
  }

  return `'${key}'`;
}

/**
 * Renders the member lines (without the surrounding braces) for an object, indented at `indentLevel`.
 * Key order is preserved so the output is stable across runs.
 */
function renderMembers(value: Record<string, unknown>, indentLevel: number): string {
  const pad = INDENT.repeat(indentLevel);

  return Object.keys(value)
    .map((key) => `${pad}${formatKey(key)}: ${renderType(value[key], indentLevel + 1)};`)
    .join('\n');
}

/**
 * Renders an object as an inline `{ … }` literal type. Empty objects collapse to `{}`.
 */
function renderObject(value: Record<string, unknown>, indentLevel: number): string {
  if (Object.keys(value).length === 0) {
    return '{}';
  }

  const closingPad = INDENT.repeat(indentLevel - 1);

  return `{\n${renderMembers(value, indentLevel)}\n${closingPad}}`;
}

/**
 * Renders an array as `A[]` when all elements share one type, `Array<A | B>` when they differ, and
 * `unknown[]` when empty (no element type can be inferred). Element types are de-duplicated by their
 * rendered string so structurally identical shapes collapse into a single member.
 */
function renderArray(value: unknown[], indentLevel: number): string {
  if (value.length === 0) {
    return 'unknown[]';
  }

  const elementTypes: string[] = [];

  value.forEach((item) => {
    const type = renderType(item, indentLevel);
    if (!elementTypes.includes(type)) {
      elementTypes.push(type);
    }
  });

  if (elementTypes.length === 1) {
    return `${elementTypes[0]}[]`;
  }

  return `Array<${elementTypes.join(' | ')}>`;
}

/**
 * Maps any JSON value to its TypeScript type string. Primitives widen to their base type
 * (`'cds'` → `string`), matching the intent of a schema rather than a literal snapshot.
 */
function renderType(value: unknown, indentLevel: number): string {
  if (indentLevel > MAX_DEPTH) {
    return 'unknown';
  }

  if (value === null) {
    return 'null';
  }

  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
    case 'bigint':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      break;
  }

  if (Array.isArray(value)) {
    return renderArray(value, indentLevel);
  }

  if (isRecord(value)) {
    return renderObject(value, indentLevel);
  }

  // `undefined`, functions and symbols never survive `JSON.parse`; this is a defensive fallback.
  return 'unknown';
}

/**
 * Builds the `export interface CDS_ENV { … }` declaration for a parsed `cds.env` value.
 *
 * @param env the parsed environment object (any `JSON.parse` result is accepted).
 * @returns the interface declaration as a string, using 2-space indentation and inline nested types.
 */
export function generateCdsEnvType(env: unknown): string {
  if (!isRecord(env) || Object.keys(env).length === 0) {
    return 'export interface CDS_ENV {}';
  }

  return `export interface CDS_ENV {\n${renderMembers(env, 1)}\n}`;
}
