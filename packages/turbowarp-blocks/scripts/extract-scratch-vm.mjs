import assert from "node:assert/strict"
import fs from "node:fs"
import {createRequire} from "node:module"
import path from "node:path"
import {pathToFileURL} from "node:url"

export const BUILTIN_EXTENSIONS = [
  {id: "pen", directory: "scratch3_pen"},
  {id: "wedo2", directory: "scratch3_wedo2"},
  {id: "music", directory: "scratch3_music"},
  {id: "microbit", directory: "scratch3_microbit"},
  {id: "text2speech", directory: "scratch3_text2speech"},
  {id: "translate", directory: "scratch3_translate"},
  {id: "videoSensing", directory: "scratch3_video_sensing"},
  {id: "ev3", directory: "scratch3_ev3"},
  {id: "makeymakey", directory: "scratch3_makeymakey"},
  {id: "boost", directory: "scratch3_boost"},
  {id: "gdxfor", directory: "scratch3_gdx_for"},
  {id: "tw", directory: "tw"},
]

const inert = new Proxy(function () {}, {
  apply: () => inert,
  construct: () => inert,
  get: (_target, key) => key === Symbol.toPrimitive ? () => 0 : inert,
})

const normalizeMenu = (name, rawMenu) => {
  const menu = rawMenu.items === undefined ? {items: rawMenu} : rawMenu
  if (typeof menu.items === "string" || typeof menu.items === "function") {
    throw new Error(`Built-in extension menu ${name} is dynamic`)
  }
  return {
    name,
    acceptReporters: menu.acceptReporters === true,
    items: menu.items.map(item => typeof item === "string"
      ? {label: item, value: item}
      : {label: String(item.text), value: String(item.value)}),
  }
}

const normalizeArgument = (extensionId, opcode, [name, argument]) => ({
  name,
  type: argument.type,
  ...(extensionId === "translate" && opcode === "getTranslate" && name === "LANGUAGE"
    ? {dynamicDefault: true}
    : argument.defaultValue === undefined ? {} : {defaultValue: String(argument.defaultValue)}),
  ...(argument.menu === undefined ? {} : {menu: argument.menu}),
})

export const extractScratchVm = scratchVmRoot => {
  const root = path.resolve(scratchVmRoot)
  const managerSource = fs.readFileSync(path.join(root, "src/extension-support/extension-manager.js"), "utf8")
  const declaredBuiltins = [...managerSource.matchAll(/^\s*(\w+): \(\) => require\('([^']+)'\)/gm)]
    .map(match => ({id: match[1], source: match[2]}))
    .filter(extension => extension.id !== "coreExample")
  assert.deepEqual(
    declaredBuiltins.map(extension => extension.id),
    BUILTIN_EXTENSIONS.map(extension => extension.id),
    "defaultBuiltinExtensions does not match the audited extension list",
  )
  const require = createRequire(path.join(root, "package.json"))
  require("format-message").setup({missingTranslation: "ignore"})
  return BUILTIN_EXTENSIONS.map(({id, directory}) => {
    const sourceFile = `src/extensions/${directory}/index.js`
    const Extension = require(path.join(root, sourceFile))
    const info = new Extension(inert).getInfo()
    if (info.id !== id) throw new Error(`${sourceFile} declares extension ID ${info.id}, expected ${id}`)
    return {
      id,
      sourceFile,
      blocks: info.blocks.flatMap(block => {
        if (typeof block !== "object" || block === null || typeof block.opcode !== "string") return []
        if (["button", "label", "xml"].includes(block.blockType)) return []
        return [{
          opcode: `${id}_${block.opcode}`,
          blockType: block.blockType ?? "command",
          ...(block.isTerminal === true ? {isTerminal: true} : {}),
          arguments: Object.entries(block.arguments ?? {})
            .map(argument => normalizeArgument(id, block.opcode, argument)),
        }]
      }),
      menus: Object.entries(info.menus ?? {}).map(([name, menu]) => normalizeMenu(name, menu)),
    }
  })
}

if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.stdout.write(`${JSON.stringify(extractScratchVm(process.argv[2] ?? ""), null, 2)}\n`)
  process.exit(0)
}
