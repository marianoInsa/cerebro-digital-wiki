import { h } from "preact"
import fs from "node:fs"
import path from "node:path"
import { joinSegments, pathToRoot, resolveRelative, type FullSlug } from "../../util/path"
import { compareOrderItems, humanizeSegment } from "../../util/cerebro"
import type { QuartzComponent, QuartzComponentProps } from "../types"

let wordmark = ""
try {
  wordmark = fs.readFileSync(
    path.join(process.cwd(), "quartz", "static", "brand", "wordmark.svg"),
    "utf8",
  )
} catch {
  wordmark = ""
}

type TrieNode = {
  isFolder: boolean
  slugSegment?: string
  slug: string
  displayName?: string
  data?: {
    title?: string
    unlisted?: boolean
    description?: string
    frontmatter?: { description?: string; title?: string }
  } | null
  children?: TrieNode[]
}

type Collection = {
  title: string
  slug: string
  count: number
  description?: string
  raw: string
}

function countNotes(node: TrieNode): number {
  let count = 0
  for (const child of node.children ?? []) {
    if (child.isFolder) {
      count += countNotes(child)
    } else if (child.data?.unlisted !== true) {
      count++
    }
  }
  return count
}

function collectionDescription(node: TrieNode): string | undefined {
  const description = node.data?.frontmatter?.description ?? node.data?.description ?? undefined
  return typeof description === "string" && description.trim().length > 0
    ? description.trim()
    : undefined
}

function collectionsFromTrie(trie: TrieNode | undefined): Collection[] {
  if (!trie) return []
  return (trie.children ?? [])
    .filter((node) => node.isFolder && node.slugSegment !== "tags")
    .map((node) => ({
      title: node.displayName ?? node.slugSegment ?? node.slug,
      slug: node.slug,
      count: countNotes(node),
      description: collectionDescription(node),
      raw: node.slugSegment ?? node.slug,
    }))
    .sort((a, b) =>
      compareOrderItems(
        { title: a.title, raw: a.raw, path: a.slug, isFolder: true },
        { title: b.title, raw: b.raw, path: b.slug, isFolder: true },
      ),
    )
}

function countLabel(count: number): string {
  if (count === 0) return "Sin notas"
  return count === 1 ? "1 nota" : `${count} notas`
}

function noteTimestamp(entry: any): number {
  const value = entry.dates?.modified ?? entry.dates?.created ?? entry.date
  const time = value ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(time) ? time : 0
}

function recentNotes(allFiles: any[]): any[] {
  return allFiles
    .filter((entry) => {
      const slug = String(entry.slug ?? "")
      return (
        slug &&
        slug !== "index" &&
        slug !== "404" &&
        !slug.startsWith("tags/") &&
        !slug.endsWith("/index") &&
        entry.unlisted !== true
      )
    })
    .sort((a, b) => noteTimestamp(b) - noteTimestamp(a))
    .slice(0, 5)
}

function notePath(entry: any): string {
  const raw = String(entry.relativePath ?? entry.slug ?? "")
  const parent = path.posix.dirname(raw)
  if (parent === "." || parent.length === 0) return ""
  return parent.split("/").map(humanizeSegment).join(" › ")
}

function CollectionItem({ collection, slug }: { collection: Collection; slug: FullSlug }) {
  return h("li", { class: "collection-item" }, [
    h("a", { class: "collection-link", href: resolveRelative(slug, collection.slug as FullSlug) }, [
      h("span", { class: "collection-title" }, collection.title),
      h("span", { class: "collection-count" }, countLabel(collection.count)),
    ]),
    collection.description
      ? h("p", { class: "collection-description" }, collection.description)
      : null,
  ])
}

export const HomeIndex: QuartzComponent = (props: QuartzComponentProps) => {
  const slug = props.fileData.slug
  if (slug !== "index") return null

  const collections = collectionsFromTrie(props.ctx.trie as unknown as TrieNode)
  const recent = recentNotes(props.allFiles ?? [])
  const visible = collections.slice(0, 12)
  const rest = collections.slice(12)
  const root = pathToRoot(slug)
  const avif = joinSegments(root, "static/brand/cover-plate-1600x1200.avif")
  const webp = joinSegments(root, "static/brand/cover-plate-1600x1200.webp")

  return h("section", { class: "home-index" }, [
    h("h1", { class: "visually-hidden" }, props.cfg.pageTitle),
    wordmark
      ? h("div", {
          class: "home-wordmark",
          "aria-hidden": "true",
          dangerouslySetInnerHTML: { __html: wordmark },
        })
      : h("p", { class: "home-wordmark fallback" }, "Cerebro Digital"),
    h("p", { class: "home-tagline" }, "Archivo personal de estudio."),
    collections.length > 0
      ? h("div", { class: "home-collections" }, [
          h("h2", { class: "section-label" }, "Colecciones"),
          h(
            "ul",
            { class: "collection-list" },
            visible.map((collection) => h(CollectionItem, { collection, slug: slug as FullSlug })),
          ),
          rest.length > 0
            ? h("details", { class: "collection-more" }, [
                h("summary", {}, "Todas las colecciones"),
                h(
                  "ul",
                  { class: "collection-list" },
                  rest.map((collection) =>
                    h(CollectionItem, { collection, slug: slug as FullSlug }),
                  ),
                ),
              ])
            : null,
        ])
      : null,
    recent.length > 0
      ? h("section", { class: "home-recent" }, [
          h("h2", { class: "section-label" }, "Notas recientes"),
          h(
            "ul",
            { class: "recent-list" },
            recent.map((entry) =>
              h("li", { class: "recent-item" }, [
                h(
                  "a",
                  { href: resolveRelative(slug as FullSlug, entry.slug as FullSlug) },
                  String(entry.frontmatter?.title ?? "Sin título"),
                ),
                notePath(entry) ? h("span", { class: "recent-path" }, notePath(entry)) : null,
              ]),
            ),
          ),
        ])
      : null,
    h("figure", { class: "home-plate" }, [
      h("picture", {}, [
        h("source", { srcset: avif, type: "image/avif" }),
        h("source", { srcset: webp, type: "image/webp" }),
        h("img", {
          src: webp,
          width: 1600,
          height: 1200,
          loading: "lazy",
          decoding: "async",
          alt: "Lámina de portada: un árbol inclinado sobre una cresta de piedra, entre niebla fría y ceniza.",
        }),
      ]),
      h("figcaption", {}, "Ceniza y hierro: el archivo como volumen de estudio."),
    ]),
  ])
}

export default HomeIndex
