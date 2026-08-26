import type {Opcode} from "@scratch-code/ast"

import {
  DuplicateBlockSpecError,
  InvalidResolvedBlockSpecError,
  MissingBlockSpecError,
} from "./errors.js"
import type {BlockSpec, BlockSpecResolver} from "./types.js"

interface RegistryEntry<TContext> {
  readonly baseSpec: BlockSpec
  readonly resolver?: BlockSpecResolver<TContext>
}

/** A collection of stable block specs with optional context-dependent resolution. */
export class BlockSpecRegistry<TContext = unknown> {
  readonly #entries = new Map<Opcode, RegistryEntry<TContext>>()

  get size(): number {
    return this.#entries.size
  }

  register(
    baseSpec: BlockSpec,
    resolver?: BlockSpecResolver<TContext>,
  ): this {
    if (this.#entries.has(baseSpec.opcode)) {
      throw new DuplicateBlockSpecError(baseSpec.opcode)
    }
    this.#entries.set(baseSpec.opcode, createEntry(baseSpec, resolver))
    return this
  }

  replace(
    baseSpec: BlockSpec,
    resolver?: BlockSpecResolver<TContext>,
  ): this {
    if (!this.#entries.has(baseSpec.opcode)) {
      throw new MissingBlockSpecError(baseSpec.opcode)
    }
    this.#entries.set(baseSpec.opcode, createEntry(baseSpec, resolver))
    return this
  }

  get(opcode: Opcode): BlockSpec | undefined {
    return this.#entries.get(opcode)?.baseSpec
  }

  require(opcode: Opcode): BlockSpec {
    const spec = this.get(opcode)
    if (spec === undefined) throw new MissingBlockSpecError(opcode)
    return spec
  }

  resolve(opcode: Opcode, context: TContext): BlockSpec | undefined {
    const entry = this.#entries.get(opcode)
    if (entry === undefined) return undefined
    if (entry.resolver === undefined) return entry.baseSpec

    const resolved = entry.resolver(entry.baseSpec, context)
    if (resolved.opcode !== opcode) {
      throw new InvalidResolvedBlockSpecError(opcode, resolved.opcode)
    }
    return resolved
  }

  resolveRequired(opcode: Opcode, context: TContext): BlockSpec {
    const spec = this.resolve(opcode, context)
    if (spec === undefined) throw new MissingBlockSpecError(opcode)
    return spec
  }

  has(opcode: Opcode): boolean {
    return this.#entries.has(opcode)
  }

  unregister(opcode: Opcode): boolean {
    return this.#entries.delete(opcode)
  }

  opcodes(): IterableIterator<Opcode> {
    return this.#entries.keys()
  }
}

const createEntry = <TContext>(
  baseSpec: BlockSpec,
  resolver: BlockSpecResolver<TContext> | undefined,
): RegistryEntry<TContext> =>
  resolver === undefined ? {baseSpec} : {baseSpec, resolver}

export const createBlockSpecRegistry = <TContext = unknown>(): BlockSpecRegistry<TContext> =>
  new BlockSpecRegistry<TContext>()
