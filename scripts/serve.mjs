import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import zlib from "node:zlib"
import mime from "mime-types"

const portArgIndex = process.argv.indexOf("--port")
const port = Number(portArgIndex >= 0 ? process.argv[portArgIndex + 1] : (process.env.PORT ?? 8080))
const root = path.resolve("public")

const compressible = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".svg",
  ".xml",
  ".txt",
  ".map",
  ".webmanifest",
])

function resolveRequestPath(requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0])
  const normalized = path.posix.normalize(decoded)
  if (normalized.includes("..")) return null
  const relative = normalized.replace(/^\/+/, "")
  const direct = path.join(root, relative)
  if (!direct.startsWith(root)) return null

  if (normalized.endsWith("/")) {
    const index = path.join(direct, "index.html")
    return fs.existsSync(index) ? { file: index, redirect: null } : null
  }

  if (fs.existsSync(direct)) {
    const stat = fs.statSync(direct)
    if (stat.isDirectory()) return { file: null, redirect: `${normalized}/` }
    return { file: direct, redirect: null }
  }

  const html = `${direct}.html`
  if (fs.existsSync(html)) return { file: html, redirect: null }

  const index = path.join(direct, "index.html")
  if (fs.existsSync(index)) return { file: index, redirect: null }

  return null
}

const server = http.createServer((request, response) => {
  const resolved = resolveRequestPath(request.url ?? "/")
  if (!resolved) {
    const notFound = path.join(root, "404.html")
    if (fs.existsSync(notFound)) {
      const body = fs.readFileSync(notFound)
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
      response.end(request.method === "HEAD" ? undefined : body)
      return
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
    response.end("404")
    return
  }

  if (resolved.redirect) {
    response.writeHead(301, { Location: resolved.redirect })
    response.end()
    return
  }

  if (!resolved.file) {
    response.writeHead(404)
    response.end()
    return
  }

  const ext = path.extname(resolved.file).toLowerCase()
  const type = mime.lookup(resolved.file) || "application/octet-stream"
  const acceptsGzip = String(request.headers["accept-encoding"] ?? "").includes("gzip")
  const useGzip = acceptsGzip && compressible.has(ext)
  const headers = {
    "Content-Type": type,
    "Cache-Control": "no-store",
    Vary: "Accept-Encoding",
  }

  if (useGzip) {
    const body = zlib.gzipSync(fs.readFileSync(resolved.file), { level: 9 })
    headers["Content-Encoding"] = "gzip"
    headers["Content-Length"] = body.length
    response.writeHead(200, headers)
    response.end(request.method === "HEAD" ? undefined : body)
    return
  }

  headers["Content-Length"] = fs.statSync(resolved.file).size
  response.writeHead(200, headers)
  if (request.method === "HEAD") {
    response.end()
    return
  }
  fs.createReadStream(resolved.file).pipe(response)
})

server.listen(port, "127.0.0.1", () => {
  console.log(`static preview on http://localhost:${port}/`)
})
