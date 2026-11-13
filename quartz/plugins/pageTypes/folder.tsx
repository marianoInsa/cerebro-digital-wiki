import path from "node:path"
import { h } from "preact"
import { FolderPage } from "@quartz-community/folder-page"
import { compareOrderItems, humanizeSegment } from "../../util/cerebro"
import { resolveRelative, type FullSlug } from "../../util/path"
import type { QuartzComponent, QuartzComponentProps } from "../../components/types"
import type { QuartzPageTypePlugin } from "../types"
import type { QuartzPluginData } from "../vfile"

type TrieNode = {
  isFolder: boolean
  slugSegment?: string
  displayName?: string
  data?: { title?: string; frontmatter?: { title?: string } } | null
  children?: TrieNode[]
}

function humanizeTrie(node: TrieNode | undefined) {
  if (!node) return
  if (node.isFolder) {
    const rawSegment = node.slugSegment ?? ""
    const rawName = node.displayName ?? rawSegment
    const dataTitle = node.data?.frontmatter?.title ?? node.data?.title
    const hasExplicitTitle =
      typeof dataTitle === "string" &&
      dataTitle.length > 0 &&
      dataTitle !== "index" &&
      dataTitle !== rawSegment
    if (!hasExplicitTitle) {
      node.displayName = humanizeSegment(rawName)
    }
  }
  for (const child of node.children ?? []) humanizeTrie(child)
}

function folderTitle(title: string, slug: string): string {
  const rawSegment =
    slug
      .replace(/\/index$/, "")
      .split("/")
      .pop() ?? title
  const withoutPrefix = title.replace(/^Folder:\s*/i, "")
  const humanizedTitle = humanizeSegment(withoutPrefix)
  const humanizedRaw = humanizeSegment(rawSegment)
  if (
    !withoutPrefix ||
    withoutPrefix === "index" ||
    withoutPrefix === rawSegment ||
    humanizedTitle.toLocaleLowerCase("es") === humanizedRaw.toLocaleLowerCase("es")
  ) {
    return humanizedTitle || humanizedRaw
  }
  return withoutPrefix
}

function sortFolderEntries(a: QuartzPluginData, b: QuartzPluginData): number {
  const rawOf = (entry: QuartzPluginData) =>
    path.posix.basename(String(entry.relativePath ?? entry.slug ?? ""))
  return compareOrderItems(
    {
      title: String(a.frontmatter?.title ?? rawOf(a)),
      raw: rawOf(a),
      order: a.frontmatter?.order,
      path: String(a.slug ?? ""),
      isFolder: String(a.slug ?? "").endsWith("/index"),
    },
    {
      title: String(b.frontmatter?.title ?? rawOf(b)),
      raw: rawOf(b),
      order: b.frontmatter?.order,
      path: String(b.slug ?? ""),
      isFolder: String(b.slug ?? "").endsWith("/index"),
    },
  )
}

function hasChildren(props: QuartzComponentProps, slug: string): boolean {
  const prefix = slug.endsWith("/index") ? slug.slice(0, -"index".length) : `${slug}/`
  return (props.allFiles ?? []).some((entry) => {
    const entrySlug = String(entry.slug ?? "")
    return (
      entrySlug.startsWith(prefix) &&
      entrySlug !== slug &&
      entrySlug !== `${prefix}index` &&
      entry.unlisted !== true
    )
  })
}

export const CerebroFolderPage: QuartzPageTypePlugin = () => {
  const base = FolderPage({
    showFolderCount: true,
    showSubfolders: true,
    sort: sortFolderEntries,
    prefixFolders: false,
  })
  const BaseBody = base.body() as QuartzComponent

  const Body: QuartzComponent = (props: QuartzComponentProps) => {
    const slug = String(props.fileData.slug ?? "")
    if (hasChildren(props, slug)) {
      return h(BaseBody as never, props as never) as never
    }
    const parent = path.posix.dirname(slug)
    const parentSlug =
      parent === "." || parent.length === 0 ? null : (`${parent}/index` as FullSlug)
    return h("div", { class: "folder-empty" }, [
      h("p", {}, "Esta colección todavía no tiene notas."),
      parentSlug
        ? h(
            "a",
            { href: resolveRelative(slug as FullSlug, parentSlug), class: "internal" },
            "Volver a la colección",
          )
        : null,
    ]) as never
  }

  Body.css = BaseBody.css
  Body.afterDOMLoaded = BaseBody.afterDOMLoaded

  return {
    ...base,
    name: "CerebroFolderPage",
    generate(args: any) {
      humanizeTrie(args.ctx.trie as unknown as TrieNode)
      const pages = base.generate?.(args) ?? []

      for (const [, file] of args.content) {
        const slug = String(file.data.slug ?? "")
        if (!slug.endsWith("/index")) continue
        const frontmatter = file.data.frontmatter
        if (!frontmatter) continue
        frontmatter.title = folderTitle(String(frontmatter.title ?? ""), slug)
      }

      return pages.map((page) => ({
        ...page,
        title: folderTitle(page.title, page.slug),
      }))
    },
    body: () => Body,
  } as unknown as ReturnType<QuartzPageTypePlugin>
}

export default CerebroFolderPage
