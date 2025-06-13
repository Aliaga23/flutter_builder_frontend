import type { Operation } from "fast-json-patch"

/*    /pages/0/body/…            ➜ widget
 *    /pages/0/title             ➜ prop de página
 *    /pages/0/backgroundColor   ➜ prop de página
 *    /pages                     ➜ array de páginas (añadir/eliminar)
 *    /pages/0                   ➜ página completa (reemplazar/eliminar)
 *    /pages/-                   ➜ añadir página
 */
const ALLOW = /^\/pages(\/\d+)?(\/.*)?$/

/** Devuelve solo las ops que queremos sincronizar */
export function keepAllowedOps(ops: Operation[]): Operation[] {
  return ops.filter((op) => ALLOW.test(op.path || op.from || ""))
}
