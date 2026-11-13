import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const fixture = path.join(root, "test", "fixtures", "synthetic-content")
const output = path.join(root, ".tmp", "synthetic-build")

const result = spawnSync(
  process.execPath,
  ["quartz/bootstrap-cli.mjs", "build", "-d", fixture, "-o", output],
  { cwd: root, encoding: "utf8" },
)
if (result.status !== 0) {
  console.error(result.stdout)
  console.error(result.stderr)
  throw new Error(`synthetic build failed with status ${result.status}`)
}

const read = (relative) => fs.readFileSync(path.join(output, relative), "utf8")
const titleOf = (html) => (html.match(/<title>(.*?)<\/title>/s) ?? [])[1] ?? ""
const h1Count = (html) => [...html.matchAll(/<h1[\s>]/g)].length
const listTitles = (html) =>
  [...html.matchAll(/<li class="section-li">([\s\S]*?)<\/li>/g)]
    .map((match) => {
      const title = match[1].match(/<h3[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/)
      return title ? title[1].replace(/<[^>]+>/g, "").trim() : null
    })
    .filter(Boolean)

const checks = []
const check = (name, fn) => {
  fn()
  checks.push(name)
}

check("home keeps the authored title and has one H1", () => {
  const html = read("index.html")
  assert.equal(titleOf(html), "Fixture Home")
  assert.equal(h1Count(html), 1)
})

check("note without frontmatter takes the first H1", () => {
  const html = read("10_alfa/01-nota-sin-frontmatter.html")
  assert.equal(titleOf(html), "Título desde H1")
  assert.equal(h1Count(html), 1)
})

check("explicit frontmatter title wins", () => {
  assert.equal(titleOf(read("10_alfa/02-frontmatter-completo.html")), "Título Explícito")
})

check("multiple H1 are demoted to one page title", () => {
  const html = read("beta/tres-encabezados.html")
  assert.equal(titleOf(html), "Primer Encabezado")
  assert.equal(h1Count(html), 1)
})

check("numeric prefixes are removed from display titles", () => {
  assert.equal(titleOf(read("beta/01-primera.html")), "Primera")
  assert.equal(titleOf(read("beta/10-décima.html")), "Décima")
  assert.equal(titleOf(read("árbol_ñandú/index.html")), "Árbol Ñandú")
  assert.equal(titleOf(read("10_alfa/05_subsección/index.html")), "Subsección")
})

check("collection order follows prefix, explicit order and alphabet", () => {
  assert.deepEqual(listTitles(read("beta/index.html")), [
    "Solo Índice",
    "Primera",
    "Segunda",
    "Décima",
    "Orden Explícito",
    "Duplicada",
    "Imagen Faltante",
    "Primer Encabezado",
    "Sin Metadatos",
    "Wikilink Roto",
  ])
})

check("empty collection has an intro and a parent link", () => {
  const html = read("beta/solo-índice/index.html")
  assert.match(html, /Esta colección todavía no tiene notas/)
  assert.match(html, /Volver a la colección/)
})

check("draft is absent and unlisted is present but not listed", () => {
  assert.equal(fs.existsSync(path.join(output, "beta", "borrador.html")), false)
  assert.equal(fs.existsSync(path.join(output, "beta", "no-listada.html")), true)
  assert.ok(!listTitles(read("beta/index.html")).includes("No Listada"))
})

check("utility folders are excluded", () => {
  assert.equal(fs.existsSync(path.join(output, "exports")), false)
})

check("404 page is rendered in Spanish", () => {
  const html = read("404.html")
  assert.match(titleOf(html), /No se ha encontrado/)
  assert.equal(h1Count(html), 1)
})

check("no generated page has more than one H1", () => {
  const htmlFiles = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith(".html")) htmlFiles.push(full)
    }
  }
  walk(output)
  const bad = htmlFiles.filter((file) => h1Count(fs.readFileSync(file, "utf8")) > 1)
  assert.deepEqual(bad, [])
})

check("renaming or adding a collection changes navigation without theme edits", () => {
  const renamedFixture = path.join(root, ".tmp", "synthetic-renamed")
  const renamedOutput = path.join(root, ".tmp", "synthetic-renamed-build")
  fs.rmSync(renamedFixture, { recursive: true, force: true })
  fs.cpSync(fixture, renamedFixture, { recursive: true })
  const gamma = path.join(renamedFixture, "Gamma")
  fs.mkdirSync(gamma, { recursive: true })
  fs.writeFileSync(path.join(gamma, "01-Nueva.md"), "# Nueva\n\nContenido de prueba.\n")
  fs.rmSync(renamedOutput, { recursive: true, force: true })
  const renamedBuild = spawnSync(
    process.execPath,
    ["quartz/bootstrap-cli.mjs", "build", "-d", renamedFixture, "-o", renamedOutput],
    { cwd: root, encoding: "utf8" },
  )
  assert.equal(renamedBuild.status, 0, renamedBuild.stderr)
  assert.equal(
    titleOf(fs.readFileSync(path.join(renamedOutput, "gamma", "index.html"), "utf8")),
    "Gamma",
  )
})

console.log(`synthetic verification passed: ${checks.length} checks`)
