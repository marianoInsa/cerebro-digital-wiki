import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const pages = [
  ["home", "http://localhost:8080/"],
  ["collection", "http://localhost:8080/01_universidad/"],
  [
    "note",
    "http://localhost:8080/01_universidad/administraci%C3%B3n-de-sistemas-de-informaci%C3%B3n/00---hub",
  ],
]
const outputDir = process.argv[2] ?? "docs/evidence/2026-11-13-redesign/lighthouse-final"
fs.mkdirSync(outputDir, { recursive: true })

const rows = []
for (const [name, url] of pages) {
  for (const mode of ["mobile", "desktop"]) {
    const output = path.join(outputDir, `${name}-${mode}.json`)
    const args = [
      "--yes",
      "lighthouse@12",
      url,
      "--output=json",
      `--output-path=${output}`,
      "--chrome-flags=--headless=new --no-sandbox",
      "--quiet",
    ]
    if (mode === "desktop") args.push("--preset=desktop")
    const result = spawnSync("npx", args, { encoding: "utf8", shell: true })
    if (result.status !== 0) {
      console.error(result.stderr)
      throw new Error(`Lighthouse failed for ${name} ${mode}`)
    }
    const report = JSON.parse(fs.readFileSync(output, "utf8"))
    const audit = report.audits
    rows.push({
      page: name,
      mode,
      score: Math.round(report.categories.performance.score * 100),
      lcp: Math.round(audit["largest-contentful-paint"].numericValue),
      cls: Math.round(audit["cumulative-layout-shift"].numericValue * 1000) / 1000,
      tbt: Math.round(audit["total-blocking-time"].numericValue),
    })
  }
}
console.table(rows)
