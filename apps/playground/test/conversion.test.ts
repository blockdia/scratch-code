import { describe, expect, it } from 'vitest';

import {
  astToText,
  assertScriptArray,
  formatAst,
  parseAst,
  scriptsToText,
  textToAst,
} from '../src/conversion.js';

const example = ['when green flag clicked', 'repeat (3)', '  move (10) steps', 'end'].join('\n');

describe('playground conversion', () => {
  it('parses the example into semantic scripts', () => {
    const scripts = textToAst(example);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.blocks.map((block) => block.opcode)).toEqual([
      'event_whenflagclicked',
      'control_repeat',
    ]);
  });

  it('formats AST JSON with two-space indentation', () => {
    const formatted = formatAst(textToAst('move (10) steps'));
    expect(formatted).toContain('\n  {\n    "kind": "script"');
  });

  it('serializes AST JSON back to scratchblocks text', () => {
    const json = formatAst(textToAst(example));
    expect(astToText(json)).toBe(example.replace('when green flag clicked', 'when flag clicked'));
  });

  it('exposes parsing and serialization separately for playground state', () => {
    const scripts = parseAst(formatAst(textToAst(example)));
    expect(scriptsToText(scripts)).toBe(
      example.replace('when green flag clicked', 'when flag clicked'),
    );
  });

  it('round-trips the semantic result', () => {
    const first = textToAst(example);
    const rebuiltText = astToText(formatAst(first));
    expect(textToAst(rebuiltText)).toEqual(first);
  });

  it('reports a strict coercion mismatch', () => {
    expect(() => textToAst('move [not a number] steps :: motion', 'strict')).toThrow(
      /STEPS|number/i,
    );
  });

  it('rejects malformed JSON', () => {
    expect(() => astToText('[')).toThrow(SyntaxError);
  });

  it('rejects a non-array AST root', () => {
    expect(() => astToText('{"kind":"script","blocks":[]}')).toThrow(
      'The AST must be a JSON array',
    );
  });

  it('rejects malformed script and block nodes', () => {
    expect(() => assertScriptArray([{ kind: 'script', blocks: [{ kind: 'block' }] }])).toThrow(
      'opcode must be a non-empty string',
    );
  });
});
