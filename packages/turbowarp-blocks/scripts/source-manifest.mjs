const argumentsFor = blockJson => blockJson === null
  ? []
  : [blockJson.args0, blockJson.args1, blockJson.args2, blockJson.args3].flatMap(value => value ?? [])

export const createSourceManifest = records => records.map(record => {
  const args = argumentsFor(record.blockJson)
  const inputs = Object.fromEntries(args
    .filter(argument => argument.name && ["input_value", "input_statement"].includes(argument.type))
    .map(argument => [argument.name, argument.type === "input_statement" ? "statement" : "value"]))
  const fields = Object.fromEntries(args
    .filter(argument => argument.name && argument.type?.startsWith("field_") && argument.type !== "field_image")
    .map(argument => [argument.name, argument.type]))
  if (record.opcode === "control_stop") fields.STOP_OPTION = "field_dropdown"
  return {
    opcode: record.opcode,
    sourceFile: record.file,
    inputs,
    fields,
    dynamic: ["control_stop", "procedures_call", "procedures_prototype"].includes(record.opcode),
  }
})
