import path from "node:path"
import { h } from "preact"
import { compareOrderItems } from "../../util/cerebro"
import { resolveRelative, type FullSlug } from "../../util/path"
import type { QuartzComponent, QuartzComponentProps } from "../types"
import type { QuartzPluginData } from "../../plugins/vfile"

function rawName(entry: QuartzPluginData): string {
  return path.posix.basename(String(entry.relativePath ?? entry.slug ?? ""))
}

function compareSiblings(a: QuartzPluginData, b: QuartzPluginData): number {
  return compareOrderItems(
    {
      title: String(a.frontmatter?.title ?? rawName(a)),
      raw: rawName(a),
      order: a.frontmatter?.order,
      path: String(a.slug ?? ""),
      isFolder: false,
    },
    {
      title: String(b.frontmatter?.title ?? rawName(b)),
      raw: rawName(b),
      order: b.frontmatter?.order,
      path: String(b.slug ?? ""),
      isFolder: false,
    },
  )
}

export const NoteFooter: QuartzComponent = (props: QuartzComponentProps) => {
  const slug = String(props.fileData.slug ?? "")
  if (slug === "index" || slug === "404" || slug.startsWith("tags/") || slug.endsWith("/index")) {
    return null
  }

  const tags = Array.isArray(props.fileData.frontmatter?.tags)
    ? props.fileData.frontmatter.tags.map(String)
    : []
  const parent = path.posix.dirname(slug)
  const parentSlug = parent === "." || parent.length === 0 ? null : (`${parent}/index` as FullSlug)

  const siblings = (props.allFiles ?? [])
    .filter((entry) => {
      const entrySlug = String(entry.slug ?? "")
      if (!entrySlug || entry.unlisted === true) return false
      if (entrySlug.endsWith("/index")) return false
      return path.posix.dirname(entrySlug) === parent
    })
    .sort(compareSiblings)

  const currentIndex = siblings.findIndex((entry) => entry.slug === slug)
  const previous = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const next = currentIndex >= 0 ? (siblings[currentIndex + 1] ?? null) : null

  if (tags.length === 0 && !parentSlug && !previous && !next) return null

  return h("div", { class: "note-footer" }, [
    tags.length > 0
      ? h("ul", { class: "note-tags", "aria-label": "Etiquetas" }, [
          ...tags.map((tag) => h("li", { class: "note-tag" }, tag)),
        ])
      : null,
    parentSlug
      ? h(
          "a",
          {
            class: "back-to-collection internal",
            href: resolveRelative(slug as FullSlug, parentSlug),
          },
          "Volver a la colección",
        )
      : null,
    previous || next
      ? h("nav", { class: "note-pager", "aria-label": "Navegación entre notas" }, [
          previous
            ? h(
                "a",
                {
                  class: "note-pager-link previous",
                  href: resolveRelative(slug as FullSlug, previous.slug as FullSlug),
                },
                [
                  h("span", { class: "note-pager-label" }, "Anterior"),
                  h(
                    "span",
                    { class: "note-pager-title" },
                    String(previous.frontmatter?.title ?? ""),
                  ),
                ],
              )
            : h("span", { class: "note-pager-spacer" }),
          next
            ? h(
                "a",
                {
                  class: "note-pager-link next",
                  href: resolveRelative(slug as FullSlug, next.slug as FullSlug),
                },
                [
                  h("span", { class: "note-pager-label" }, "Siguiente"),
                  h("span", { class: "note-pager-title" }, String(next.frontmatter?.title ?? "")),
                ],
              )
            : h("span", { class: "note-pager-spacer" }),
        ])
      : null,
  ])
}

export default NoteFooter
