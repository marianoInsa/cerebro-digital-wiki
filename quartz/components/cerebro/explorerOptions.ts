export const explorerOptions = {
  folderDefaultState: "collapsed",
  folderClickBehavior: "link",
  useSavedState: true,
  filterFn: (node: any) => node.slugSegment !== "tags",
  mapFn: (node: any) => {
    if (node.isFolder) {
      const raw = String(node.displayName ?? node.slugSegment ?? "")
      const dataTitle = node.data?.frontmatter?.title ?? node.data?.title
      const hasExplicitTitle =
        typeof dataTitle === "string" &&
        dataTitle.length > 0 &&
        dataTitle !== "index" &&
        dataTitle !== raw
      if (!hasExplicitTitle) {
        const stripped = raw.replace(/^\d{1,3}(?:[._]\d{1,3})*(?:[\s._-]+|$)/, "").trim() || raw
        node.displayName = stripped.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
      }
    }
    return node
  },
  sortFn: (a: any, b: any) => {
    if (Boolean(a.isFolder) !== Boolean(b.isFolder)) return a.isFolder ? -1 : 1
    const rawA = String(a.slugSegment ?? a.data?.filePath?.split("/").pop() ?? "")
    const rawB = String(b.slugSegment ?? b.data?.filePath?.split("/").pop() ?? "")
    const matchA = rawA.match(/^(\d{1,3}(?:[._]\d{1,3})*)(?:[\s._-]+|$)/)
    const matchB = rawB.match(/^(\d{1,3}(?:[._]\d{1,3})*)(?:[\s._-]+|$)/)
    const prefixA = matchA ? matchA[1].split(/[._]/) : null
    const prefixB = matchB ? matchB[1].split(/[._]/) : null
    if (prefixA && prefixB) {
      const length = Math.max(prefixA.length, prefixB.length)
      for (let index = 0; index < length; index++) {
        const left = Number.parseInt(prefixA[index] ?? "0", 10)
        const right = Number.parseInt(prefixB[index] ?? "0", 10)
        if (left !== right) return left - right
      }
    } else if (prefixA) {
      return -1
    } else if (prefixB) {
      return 1
    }

    const orderA = a.data?.frontmatter?.order
    const orderB = b.data?.frontmatter?.order
    const hasOrderA = typeof orderA === "number" && Number.isFinite(orderA)
    const hasOrderB = typeof orderB === "number" && Number.isFinite(orderB)
    if (hasOrderA && hasOrderB && orderA !== orderB) return orderA - orderB
    if (hasOrderA && !hasOrderB) return -1
    if (!hasOrderA && hasOrderB) return 1

    return String(a.displayName ?? "").localeCompare(String(b.displayName ?? ""), "es", {
      numeric: true,
      sensitivity: "base",
    })
  },
}
