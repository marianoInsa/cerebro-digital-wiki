import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

const root = process.argv[2] ?? "public"
const outDir = process.argv[3] ?? "docs/evidence/2026-11-13-redesign/baseline"
fs.mkdirSync(outDir, { recursive: true })

const rows = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.isFile()) {
      const buf = fs.readFileSync(full)
      const ext = path.extname(entry.name).toLowerCase() || "(none)"
      rows.push({
        path: path.relative(root, full).replaceAll("\\", "/"),
        ext,
        raw: buf.length,
        gzip: zlib.gzipSync(buf, { level: 9 }).length,
      })
    }
  }
}
walk(root)

const groups = {}
for (const row of rows) {
  const g = (groups[row.ext] ??= { files: 0, raw: 0, gzip: 0 })
  g.files++
  g.raw += row.raw
  g.gzip += row.gzip
}

const html = rows.filter((r) => r.ext === ".html")
const css = rows.filter((r) => r.ext === ".css")
const js = rows.filter((r) => r.ext === ".js")
const summary = {
  generatedAt: new Date().toISOString(),
  root,
  totals: { files: rows.length, raw: rows.reduce((a, r) => a + r.raw, 0) },
  groups,
  cssTotalGzip: css.reduce((a, r) => a + r.gzip, 0),
  jsTotalGzip: js.reduce((a, r) => a + r.gzip, 0),
  htmlCount: html.length,
  htmlMaxGzip: html.reduce((a, r) => Math.max(a, r.gzip), 0),
  largest: rows.sort((a, b) => b.raw - a.raw).slice(0, 20),
}
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2))
fs.writeFileSync(
  path.join(outDir, "assets.csv"),
  "path,ext,raw_bytes,gzip_bytes\n" +
    rows
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((r) => `${r.path},${r.ext},${r.raw},${r.gzip}`)
      .join("\n") +
    "\n",
)
console.log(JSON.stringify(summary, null, 2))
