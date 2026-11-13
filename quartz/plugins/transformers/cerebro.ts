import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"
import { visit } from "unist-util-visit"
import type { VFile } from "vfile"
import { humanizeSegment, humanizeStem } from "../../util/cerebro"
import type { QuartzTransformerPlugin } from "../types"

type AnyNode = {
  type?: string
  value?: string
  alt?: string
  depth?: number
  tagName?: string
  properties?: Record<string, unknown>
  children?: AnyNode[]
}

function textOf(node: AnyNode): string {
  if (typeof node.value === "string" && node.type !== "code") return node.value
  if (typeof node.alt === "string") return node.alt
  if (!node.children) return ""
  return node.children.map(textOf).join("")
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function firstHeading(node: AnyNode): { depth: number; text: string } | null {
  for (const child of node.children ?? []) {
    if (child.type === "heading" && typeof child.depth === "number") {
      return { depth: child.depth, text: normalizeText(textOf(child)) }
    }
    const nested = firstHeading(child)
    if (nested) return nested
  }
  return null
}

function titlePlugin() {
  return () => (tree: AnyNode, file: VFile) => {
    const fileData = file.data as Record<string, any>
    const relativePath = String(fileData.relativePath ?? "")
    const stem = path.posix.basename(relativePath, ".md")
    const frontmatter = (fileData.frontmatter ??= {})
    const explicitTitle =
      typeof frontmatter.title === "string" ? normalizeText(frontmatter.title) : ""

    const titleIsDerived =
      explicitTitle.length === 0 ||
      explicitTitle === stem ||
      explicitTitle === "index" ||
      explicitTitle === "Untitled"

    let title = titleIsDerived ? "" : explicitTitle
    const first = firstHeading(tree)
    if (!title && first?.depth === 1 && first.text.length > 0) {
      title = first.text
    }
    if (!title) title = humanizeStem(stem)
    if (!title || title.toLowerCase() === "index") {
      const parent = humanizeSegment(path.posix.basename(path.posix.dirname(relativePath)))
      title = parent || "Sin título"
    }

    frontmatter.title = title

    let removedDuplicate = false
    visit(tree as never, "heading", (node: AnyNode, index, parent: any) => {
      if (!parent || index === undefined || index === null) return
      if (node.depth !== 1) return
      if (!removedDuplicate && normalizeText(textOf(node)) === title) {
        parent.children?.splice(index, 1)
        removedDuplicate = true
        return index
      }
      node.depth = 2
    })

    const toc = fileData.toc
    if (Array.isArray(toc)) {
      fileData.toc = toc
        .filter(
          (entry: any) =>
            !(entry?.depth === 1 && normalizeText(String(entry.text ?? "")) === title),
        )
        .map((entry: any) => (entry?.depth === 1 ? { ...entry, depth: 2 } : entry))
    }
  }
}

const imageMetadata = new Map<string, { width: number; height: number } | null>()

function resolveImagePath(src: string, file: VFile): string | null {
  if (!src || /^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith("data:")) return null
  const clean = decodeURIComponent(src.split(/[?#]/, 1)[0])
  const filePath = String((file.data as Record<string, unknown>).filePath ?? "")
  if (clean.startsWith("/")) {
    return path.resolve(process.cwd(), "content", `.${clean}`)
  }
  if (!filePath) return null
  return path.resolve(path.dirname(filePath), clean)
}

async function readImageSize(filePath: string): Promise<{ width: number; height: number } | null> {
  if (imageMetadata.has(filePath)) return imageMetadata.get(filePath) ?? null
  try {
    if (!fs.existsSync(filePath)) {
      imageMetadata.set(filePath, null)
      return null
    }
    const meta = await sharp(filePath).metadata()
    const size = meta.width && meta.height ? { width: meta.width, height: meta.height } : null
    imageMetadata.set(filePath, size)
    return size
  } catch {
    imageMetadata.set(filePath, null)
    return null
  }
}

function imagePlugin() {
  return () => async (tree: AnyNode, file: VFile) => {
    const images: AnyNode[] = []
    visit(tree as never, "element", (node: AnyNode) => {
      if (node.tagName === "img") images.push(node)
      const className = node.properties?.className
      const isTableContainer =
        node.tagName === "div" &&
        (className === "table-container" ||
          (Array.isArray(className) && className.includes("table-container")))
      if (isTableContainer) {
        node.properties ??= {}
        node.properties.tabIndex = 0
        node.properties.role = "region"
        node.properties.ariaLabel = "Tabla con desplazamiento horizontal"
      }
    })

    await Promise.all(
      images.map(async (node) => {
        const properties = (node.properties ??= {})
        properties.decoding = "async"
        properties.loading = "lazy"

        const src = typeof properties.src === "string" ? properties.src : ""
        const filePath = resolveImagePath(src, file)
        if (!filePath) return
        const size = await readImageSize(filePath)
        if (!size) return
        properties.width = size.width
        properties.height = size.height
        properties.style = `aspect-ratio: ${size.width} / ${size.height};`
      }),
    )
  }
}

export const CerebroTransform: QuartzTransformerPlugin = () => ({
  name: "CerebroTransform",
  markdownPlugins: () => [titlePlugin()],
  htmlPlugins: () => [imagePlugin() as never],
})

export default CerebroTransform
