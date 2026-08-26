export {
  DuplicateBlockSpecError,
  InvalidResolvedBlockSpecError,
  MissingBlockSpecError,
} from "./errors.js"
export {BlockSpecRegistry, createBlockSpecRegistry} from "./registry.js"
export type {
  BlockShape,
  BlockSpec,
  BlockSpecMetadata,
  BlockSpecResolver,
  BooleanBlockSpec,
  CommandBlockSpec,
  DefaultField,
  DefaultInput,
  FieldSpec,
  HatBlockSpec,
  HatStyle,
  InputAccepts,
  InputSpec,
  InputValueType,
  ReporterBlockSpec,
  ReporterOutputType,
  StatementInputSpec,
  TerminalBlockSpec,
  ValueInputSpec,
} from "./types.js"

export type {
  Block,
  BlockInput,
  Field,
  FieldType,
  Input,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  Metadata,
  NumericKind,
  Opcode,
} from "@scratch-code/ast"
