import { compare, applyPatch, type Operation } from "fast-json-patch"

export function diff(prev: any, next: any): Operation[] {
  return compare(prev, next)
}

export function apply(prev: any, ops: Operation[]): any {
  // applyPatch devuelve {newDocument: …}
  return applyPatch(prev, ops, true, false).newDocument
}
