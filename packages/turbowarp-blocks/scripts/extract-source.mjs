import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import {pathToFileURL} from "node:url"

export const SOURCE_FILES = [
  ...["motion", "looks", "sound", "event", "control", "sensing", "operators", "data", "procedures"]
    .map(name => `blocks_vertical/${name}.js`),
  ...["math", "text", "colour", "matrix", "note"]
    .map(name => `blocks_common/${name}.js`),
]
const EXCLUDED = new Set(["procedures_declaration", "argument_editor_boolean", "argument_editor_string_number"])
const parseAttributes = tag => Object.fromEntries(
  [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]),
)
const parseToolboxDefaults = xml => {
  const root = {tag: "root", children: []}
  const stack = [root]
  for (const token of xml.match(/<\/?(?:block|shadow|value|field)\b[^>]*>|[^<]+/g) ?? []) {
    if (token.startsWith("</")) stack.pop()
    else if (token.startsWith("<")) {
      const tag = token.match(/^<(\w+)/)?.[1]
      if (tag === undefined) continue
      const node = {tag, attributes: parseAttributes(token), children: [], text: ""}
      stack.at(-1).children.push(node)
      if (!token.endsWith("/>")) stack.push(node)
    } else if (stack.at(-1).tag === "field") stack.at(-1).text += token
  }
  const defaults = {}
  const visit = node => {
    if (node.tag === "block" && node.attributes.type) {
      const inputs = {}
      for (const value of node.children.filter(child => child.tag === "value")) {
        const shadow = value.children.find(child => child.tag === "shadow")
        if (shadow?.attributes.type) {
          inputs[value.attributes.name] = {
            opcode: shadow.attributes.type,
            fields: Object.fromEntries(shadow.children
              .filter(child => child.tag === "field")
              .map(field => [field.attributes.name, field.text])),
          }
        }
      }
      defaults[node.attributes.type] ??= inputs
    }
    for (const child of node.children) visit(child)
  }
  visit(root)
  return defaults
}

export const extractSource = scratchBlocksRoot => {
  const sourceText = new Map(SOURCE_FILES.map(file => [file, fs.readFileSync(path.join(scratchBlocksRoot, file), "utf8")]))
  const definitions = {}
  const noop = new Proxy(function () {}, {
    apply: () => noop,
    construct: () => noop,
    get: (_target, key) => key === Symbol.toPrimitive ? () => "" : noop,
  })
  const Blockly = new Proxy({
    Blocks: definitions,
    Msg: new Proxy({}, {get: (_target, key) => String(key)}),
    utils: {genUid: () => "uid"},
  }, {get: (target, key) => key in target ? target[key] : noop})
  const context = vm.createContext({Blockly, console, document: noop, goog: {provide() {}, require() {}}, window: noop})
  for (const [file, contents] of sourceText) vm.runInContext(contents, context, {filename: file})

  const records = []
  for (const [opcode, definition] of Object.entries(definitions)) {
    if (EXCLUDED.has(opcode)) continue
    let blockJson
    const fakeBlock = new Proxy({
      appendDummyInput: () => noop,
      jsonInit: value => { blockJson = value },
      setColour() {}, setNextStatement() {}, setPreviousStatement() {},
      workspace: {options: {}},
    }, {get: (target, key) => key in target ? target[key] : noop})
    try { definition.init?.call(fakeBlock) } catch { /* custom block */ }
    const file = SOURCE_FILES.find(candidate => sourceText.get(candidate).includes(`Blockly.Blocks['${opcode}']`))
    records.push({opcode, file, blockJson: blockJson ?? null})
  }
  vm.runInContext(fs.readFileSync(path.join(scratchBlocksRoot, "blocks_vertical/default_toolbox.js"), "utf8"), context)
  const toolboxDefaults = parseToolboxDefaults(definitions.defaultToolbox)
  records.sort((left, right) => left.opcode.localeCompare(right.opcode))
  return {records, toolboxDefaults}
}

if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.stdout.write(`${JSON.stringify(extractSource(path.resolve(process.argv[2] ?? "")), null, 2)}\n`)
}
