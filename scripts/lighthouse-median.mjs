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
const outputDir = process.argv[2] ?? "docs/evidence/2026-11-13-redesign/lighthouse-median"
fs.mkdirSync(outputDir, { recursive: true })

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const rows = []
for (const [name, url] of pages) {
  for (const mode of ["mobile", "desktop"]) {
    const runs = []
    for (let index = 1; index <= 3; index++) {
      const output = path.join(outputDir, `${name}-${mode}-${index}.json`)
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
      if (result.status !== 0) throw new Error(`Lighthouse failed for ${name} ${mode} run ${index}`)
      const report = JSON.parse(fs.readFileSync(output, "utf8"))
      const audit = report.audits
      runs.push({
        score: Math.round(report.categories.performance.score * 100),
        lcp: Math.round(audit["largest-contentful-paint"].numericValue),
        cls: Math.round(audit["cumulative-layout-shift"].numericValue * 1000) / 1000,
        tbt: Math.round(audit["total-blocking-time"].numericValue),
      })
    }
    rows.push({
      page: name,
      mode,
      score: median(runs.map((run) => run.score)),
      lcp: median(runs.map((run) => run.lcp)),
      cls: median(runs.map((run) => run.cls)),
      tbt: median(runs.map((run) => run.tbt)),
      runs: runs.map((run) => `${run.score}/${run.lcp}/${run.cls}/${run.tbt}`).join(" "),
    })
  }
}
console.table(rows)
fs.writeFileSync(path.join(outputDir, "summary.json"), JSON.stringify(rows, null, 2))
