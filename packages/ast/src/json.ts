import type {JsonValue} from "./types.js"

/** Return whether a value is JSON-safe, including finite-number validation. */
export const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isJsonValue)
  if (typeof value !== "object") return false
  return Object.entries(value).every(([, child]) => child === undefined || isJsonValue(child))
}

/** Assert that a value contains no non-JSON values or non-finite numbers. */
export const assertJsonValue = (value: unknown): asserts value is JsonValue => {
  if (!isJsonValue(value)) throw new TypeError("Value is not JSON-safe.")
}
