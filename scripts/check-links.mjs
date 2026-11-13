import fs from "node:fs"
import path from "node:path"

const root = path.resolve("public")
const broken = new Map()
const checked = new Set()

const isExternal = (value) =>
  /^(?:[a-z]+:)?\/\//i.test(value) ||
  value.startsWith("mailto:") ||
  value.startsWith("tel:") ||
  value.startsWith("data:") ||
  value.startsWith("#") ||
  value.startsWith("javascript:")

const resolveTarget = (value, fromFile) => {
  const clean = decodeURIComponent(value.split(/[?#]/, 1)[0])
  if (!clean) return true
  const base = clean.startsWith("/")
    ? path.join(root, clean.replace(/^\/+/, ""))
    : path.resolve(path.dirname(fromFile), clean)
  const candidates = clean.endsWith("/")
    ? [path.join(base, "index.html")]
    : [base, `${base}.html`, path.join(base, "index.html")]
  return candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
}

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(full, "utf8")
      for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const value = match[1]
        if (isExternal(value)) continue
        const key = `${path.relative(root, full)} -> ${value}`
        if (checked.has(key)) continue
        checked.add(key)
        if (!resolveTarget(value, full)) {
          broken.set(value, (broken.get(value) ?? 0) + 1)
        }
      }
    }
  }
}

walk(root)

const allowed = [...broken.keys()].filter(
  (value) =>
    /\.pdf(?:[?#]|$)/i.test(value) ||
    /excalidraw\//i.test(value) ||
    /pasted-image-20260923/i.test(value),
)
const notAllowed = [...broken.keys()].filter((value) => !allowed.includes(value))

console.log(
  JSON.stringify(
    {
      checked: checked.size,
      broken: broken.size,
      allowedKnownDebt: allowed,
      unexpected: notAllowed,
      counts: Object.fromEntries(broken),
    },
    null,
    2,
  ),
)
