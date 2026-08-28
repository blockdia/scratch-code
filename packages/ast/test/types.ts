import type {
  AstNode,
  Block,
  DropdownField,
  Input,
  ProcedureCallMutation,
  ProcedurePrototypeMutation,
  Script,
  StringInput,
  TransformContext,
  TransformVisitor,
  ValidateScriptsOptions,
} from '../src/index.js';
import { assertValidScripts, transformScripts, validateScripts } from '../src/index.js';

const validScript: Script = {
  kind: 'script',
  blocks: [],
  metadata: { scratch: { x: 1, y: 2 } },
};

const validBlock: Block = {
  kind: 'block',
  opcode: 'motion_xposition',
  fields: {},
  inputs: {},
  metadata: { scratch: { id: 'block-id' } },
};

const validInput: Input = {
  kind: 'input',
  type: 'number',
  value: '0010',
  metadata: { scratch: { id: 'number-id', numericKind: 'integer' } },
};

const validJsonField: DropdownField = {
  kind: 'field',
  type: 'dropdown',
  value: ['legacy', { nested: true }],
};

const validPrototype: ProcedurePrototypeMutation = {
  type: 'procedure-prototype',
  proccode: 'do %s',
  argumentIds: ['arg'],
  argumentNames: ['value'],
  argumentDefaults: [''],
  warp: false,
};

const validCall: ProcedureCallMutation = {
  type: 'procedure-call',
  proccode: 'do %s',
  argumentIds: ['arg'],
  warp: false,
  returnType: 'statement',
};

const transformVisitor: TransformVisitor = {
  leave(node, context) {
    const currentNode: AstNode = node;
    const currentContext: TransformContext = context;
    if (node.kind === 'block') return { ...node, opcode: `copy_${node.opcode}` };
    if (node.kind === 'input' && node.type === 'empty') {
      return { kind: 'input', type: 'string', value: 'default' };
    }
    void [currentNode, currentContext];
    return undefined;
  },
};

const transformedScripts: Script[] = transformScripts(
  [validScript] as readonly Script[],
  transformVisitor,
);

const unknownScripts: unknown = [validScript];
assertValidScripts(unknownScripts);
const narrowedScripts: readonly Script[] = unknownScripts;
const validationOptions: ValidateScriptsOptions = {};
const diagnostics = validateScripts(unknownScripts, validationOptions);

transformScripts([validScript], {
  // @ts-expect-error transform visitors return an AST node or undefined.
  leave() {
    return 'not a node';
  },
});

transformScripts([validScript], {
  // @ts-expect-error deletion is not part of the transform visitor contract.
  leave() {
    return null;
  },
});

const blockWithPosition: Block = {
  kind: 'block',
  opcode: 'test',
  fields: {},
  inputs: {},
  metadata: {
    scratch: {
      // @ts-expect-error x/y belong to Script scratch metadata, not Block metadata.
      x: 1,
    },
  },
};

const scriptWithBlockId: Script = {
  kind: 'script',
  blocks: [],
  metadata: {
    scratch: {
      // @ts-expect-error source block IDs belong to Block scratch metadata, not Script metadata.
      id: 'block-id',
    },
  },
};

const stringWithNumericKind: StringInput = {
  kind: 'input',
  type: 'string',
  value: '1',
  metadata: {
    scratch: {
      // @ts-expect-error numericKind is only valid on a number input.
      numericKind: 'integer',
    },
  },
};

// @ts-expect-error Scratch has no boolean literal input.
const booleanLiteral: Input = { kind: 'input', type: 'boolean', value: true };

// @ts-expect-error dropdowns are fields, not input literals.
const dropdownInput: Input = { kind: 'input', type: 'dropdown', value: 'option' };

const dropdownWithId: DropdownField = {
  kind: 'field',
  type: 'dropdown',
  value: 'option',
  // @ts-expect-error plain dropdown fields do not carry reference IDs.
  id: 'id',
};

// @ts-expect-error prototype mutations require names and defaults.
const incompletePrototype: ProcedurePrototypeMutation = {
  type: 'procedure-prototype',
  proccode: 'do %s',
  argumentIds: ['arg'],
  warp: false,
};

const booleanReturnFlag: ProcedureCallMutation = {
  type: 'procedure-call',
  proccode: 'do',
  argumentIds: [],
  warp: false,
  // @ts-expect-error returnType is the Scratch three-state value, not a boolean.
  returnType: true,
};

void [
  validScript,
  validBlock,
  validInput,
  validPrototype,
  validCall,
  validJsonField,
  transformedScripts,
  blockWithPosition,
  scriptWithBlockId,
  stringWithNumericKind,
  booleanLiteral,
  dropdownInput,
  dropdownWithId,
  incompletePrototype,
  booleanReturnFlag,
  narrowedScripts,
  diagnostics,
];
