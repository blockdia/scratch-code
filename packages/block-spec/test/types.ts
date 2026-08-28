import type {NumericKind as AstNumericKind} from "@scratch-code/ast"

import type {
  BlockSpec,
  DefaultInput,
  InputSpec,
  NumericKind,
  StatementInputSpec,
  ValueInputSpec,
} from "../src/index.js"

const numericKind: NumericKind = "positive-number"
const astNumericKind: AstNumericKind = numericKind
const roundTripNumericKind: NumericKind = astNumericKind

const valueInput: ValueInputSpec = {
  connection: "value",
  accepts: ["string", "number"],
  default: {kind: "input", type: "string", value: ""},
}

const statementInput: StatementInputSpec = {connection: "statement"}
const input: InputSpec = statementInput
const immutableDefault: DefaultInput = {
  kind: "input",
  type: "number",
  value: 10,
  metadata: {scratch: {numericKind: "number"}},
}

if (immutableDefault.type === "number") {
  // @ts-expect-error default AST templates are deeply readonly through this API.
  immutableDefault.value = 20
}

const standardHat: BlockSpec = {
  opcode: "event_whenflagclicked",
  shape: "hat",
  hatStyle: "standard",
  inputs: {},
  fields: {},
  arguments: [],
}

const defineHat: BlockSpec = {
  opcode: "procedures_definition",
  shape: "hat",
  hatStyle: "define",
  inputs: {custom_block: {connection: "statement"}},
  fields: {},
  arguments: [{kind: "input", name: "custom_block"}],
}

// @ts-expect-error value connections require an accepts constraint.
const valueWithoutAccepts: InputSpec = {connection: "value"}

// @ts-expect-error statement connections never declare value constraints.
const constrainedStatement: InputSpec = {connection: "statement", accepts: "boolean"}

// @ts-expect-error block describes current AST content, not a slot constraint.
const blockConstraint: InputSpec = {connection: "value", accepts: "block"}

// @ts-expect-error hats must choose their visual style.
const hatWithoutStyle: BlockSpec = {opcode: "event_test", shape: "hat", inputs: {}, fields: {}, arguments: []}

// @ts-expect-error non-hat blocks cannot declare a hat style.
const commandWithHatStyle: BlockSpec = {opcode: "motion_test", shape: "command", hatStyle: "standard", inputs: {}, fields: {}, arguments: []}

// @ts-expect-error round reporters require their semantic output type.
const reporterWithoutOutput: BlockSpec = {opcode: "sensing_test", shape: "reporter", inputs: {}, fields: {}, arguments: []}

void [
  roundTripNumericKind,
  valueInput,
  input,
  immutableDefault,
  standardHat,
  defineHat,
  valueWithoutAccepts,
  constrainedStatement,
  blockConstraint,
  hatWithoutStyle,
  commandWithHatStyle,
  reporterWithoutOutput,
]
