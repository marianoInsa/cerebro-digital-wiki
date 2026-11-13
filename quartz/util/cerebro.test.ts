import assert from "node:assert/strict"
import test from "node:test"
import {
  compareOrderItems,
  humanizeSegment,
  parseNumericPrefix,
  stripNumericPrefix,
} from "./cerebro"

test("parseNumericPrefix handles numeric prefixes and leaves semantic labels alone", () => {
  assert.deepEqual(parseNumericPrefix("01_Universidad"), [1])
  assert.deepEqual(parseNumericPrefix("1. Tema"), [1])
  assert.deepEqual(parseNumericPrefix("03.1 - Sub"), [3, 1])
  assert.deepEqual(parseNumericPrefix("10-Décima"), [10])
  assert.equal(parseNumericPrefix("U1 - Introducción"), null)
  assert.equal(parseNumericPrefix("2026 Notas"), null)
})

test("stripNumericPrefix removes one prefix and preserves accents", () => {
  assert.equal(stripNumericPrefix("01_Universidad"), "Universidad")
  assert.equal(stripNumericPrefix("03.1 - Subsección"), "Subsección")
  assert.equal(stripNumericPrefix("10-Décima"), "Décima")
  assert.equal(stripNumericPrefix("01"), "01")
})

test("humanizeSegment produces display names without changing case", () => {
  assert.equal(humanizeSegment("01_Universidad"), "Universidad")
  assert.equal(humanizeSegment("Árbol_Ñandú"), "Árbol Ñandú")
  assert.equal(humanizeSegment("U1 - Introducción"), "U1 Introducción")
})

test("compareOrderItems sorts prefixes, then order, then alphabetically", () => {
  const items = [
    { title: "Décima", raw: "10-Décima" },
    { title: "Primera", raw: "01-Primera" },
    { title: "Orden", raw: "Orden", order: 2 },
    { title: "Segunda", raw: "02-Segunda" },
  ]
  const sorted = [...items].sort(compareOrderItems).map((item) => item.title)
  assert.deepEqual(sorted, ["Primera", "Segunda", "Décima", "Orden"])
})

test("compareOrderItems puts folders first and uses path as a stable tie-break", () => {
  const sorted = [
    { title: "Nota", raw: "01-Nota", path: "b/01-nota" },
    { title: "Sub", raw: "01-Sub", path: "a/01-sub", isFolder: true },
    { title: "Otra", raw: "01-Otra", path: "a/01-otra" },
  ]
    .sort(compareOrderItems)
    .map((item) => item.title)
  assert.deepEqual(sorted, ["Sub", "Nota", "Otra"])
})
