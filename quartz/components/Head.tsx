import { i18n } from "../i18n"
import { FullSlug, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  const Head: QuartzComponent = ({ cfg, fileData, externalResources }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix

    const { css, js, additionalHead } = externalResources
    const text = String(fileData.text ?? "")
    const hasMath =
      /\$[^$\n]+\$|\\\(|\\\[|\\begin\{(?:equation|align|array|matrix|pmatrix|bmatrix|cases)/.test(
        text,
      )
    const pageCss = hasMath ? css : css.filter((resource) => !resource.content.includes("katex"))
    const pageJs = hasMath
      ? js
      : js.filter((resource) => {
          const value = "src" in resource ? resource.src : resource.script
          return !String(value ?? "").includes("katex") && !String(value ?? "").includes("copy-tex")
        })
    const headText = (item: unknown): string => {
      if (!item || typeof item === "function") return ""
      const props = (item as { props?: Record<string, any> }).props ?? {}
      return [props.src, props.href, props.dangerouslySetInnerHTML?.__html]
        .filter(Boolean)
        .join(" ")
    }
    const pageAdditionalHead = hasMath
      ? additionalHead
      : additionalHead.filter((item) => {
          const value = headText(item)
          return !value.includes("katex") && !value.includes("copy-tex")
        })

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const icon16 = joinSegments(baseDir, "static/brand/favicon-16.png")
    const icon32 = joinSegments(baseDir, "static/brand/favicon-32.png")
    const icon180 = joinSegments(baseDir, "static/brand/apple-touch-icon.png")
    const icon512 = joinSegments(baseDir, "static/brand/favicon-512.png")

    const coreStylesheet = pageCss[0]?.content
    const coreScript = pageJs.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}
        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={joinSegments(baseDir, "static/fonts.css")} />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href={icon16} sizes="16x16" type="image/png" />
        <link rel="icon" href={icon32} sizes="32x32" type="image/png" />
        <link rel="icon" href={icon512} sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href={icon180} sizes="180x180" />
        <meta name="generator" content="Quartz" />

        {pageCss.map((resource) => CSSResourceToStyleElement(resource, true))}
        {pageJs
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {pageAdditionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
