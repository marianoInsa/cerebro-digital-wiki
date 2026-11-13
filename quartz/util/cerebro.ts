const NUMERIC_PREFIX = /^(\d{1,3}(?:[._]\d{1,3})*)(?:[\s._-]+|$)/

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" })

export function parseNumericPrefix(name: string): number[] | null {
  const match = name.match(NUMERIC_PREFIX)
  if (!match) return null
  return match[1].split(/[._]/).map((part) => Number.parseInt(part, 10))
}

export function stripNumericPrefix(name: string): string {
  const match = name.match(NUMERIC_PREFIX)
  if (!match) return name
  const rest = name.slice(match[0].length).trim()
  return rest.length > 0 ? rest : name
}

export function humanizeSegment(name: string): string {
  const stripped = stripNumericPrefix(name)
  return stripped.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
}

export function humanizeStem(stem: string): string {
  const clean = stem.replace(/\.md$/i, "")
  return humanizeSegment(clean)
}

export type OrderItem = {
  title: string
  raw: string
  order?: unknown
  path?: string
  isFolder?: boolean
}

function comparePrefixes(a: number[], b: number[]): number {
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index++) {
    const left = a[index] ?? 0
    const right = b[index] ?? 0
    if (left !== right) return left - right
  }
  return 0
}

export function compareOrderItems(a: OrderItem, b: OrderItem): number {
  if (Boolean(a.isFolder) !== Boolean(b.isFolder)) {
    return a.isFolder ? -1 : 1
  }

  const aPrefix = parseNumericPrefix(a.raw)
  const bPrefix = parseNumericPrefix(b.raw)
  if (aPrefix && bPrefix) {
    const byPrefix = comparePrefixes(aPrefix, bPrefix)
    if (byPrefix !== 0) return byPrefix
  } else if (aPrefix) {
    return -1
  } else if (bPrefix) {
    return 1
  }

  const aOrder = typeof a.order === "number" && Number.isFinite(a.order) ? a.order : null
  const bOrder = typeof b.order === "number" && Number.isFinite(b.order) ? b.order : null
  if (aOrder !== null && bOrder !== null) {
    if (aOrder !== bOrder) return aOrder - bOrder
  } else if (aOrder !== null) {
    return -1
  } else if (bOrder !== null) {
    return 1
  }

  const byTitle = collator.compare(a.title, b.title)
  if (byTitle !== 0) return byTitle
  return (a.path ?? "").localeCompare(b.path ?? "", "es")
}
