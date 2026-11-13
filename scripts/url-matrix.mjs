const base = "http://localhost:8080"
const urls = [
  "/",
  "/01_universidad/",
  "/02_proyectos/",
  "/03_notas/",
  "/obsidian/",
  "/01_universidad/devops/",
  "/01_universidad/inteligencia-artificial/",
  "/01_universidad/administración-de-sistemas-de-información/00---hub",
  "/01_universidad/devops/u1---introducción-a-devops/01-que-es-devops",
  "/01_universidad/ciencia-de-datos/laboratorio-1---python-for-data-analysis/cap.-2-python,-ipython-y-jupyter",
  "/02_proyectos/00-cinaptic/detección-de-caídas.excalidraw",
  "/03_notas/investigar---desarrollo-asistido-por-agentes",
  "/obsidian/guias/00-guía-callouts",
  "/01_universidad/administración-de-sistemas-de-información/casos-y-práctica/caso-agunsa",
  "/01_universidad/física-2/3.-óptica/2.-interferencia",
  "/tags/",
  "/tags/devops",
  "/static/contentIndex.json",
  "/404.html",
  "/ruta-que-no-existe",
]

const rows = []
for (const path of urls) {
  const url = base + encodeURI(path)
  const response = await fetch(url, { redirect: "manual" })
  rows.push({
    path,
    status: response.status,
    expected: path === "/ruta-que-no-existe" ? 404 : 200,
    location: response.headers.get("location") ?? "",
  })
}

console.table(rows)
const failures = rows.filter((row) => row.status !== row.expected)
if (failures.length > 0) {
  console.error("URL failures", failures)
  process.exitCode = 1
}
