import { i18n } from "../../i18n"
import { resolveRelative, type FullSlug } from "../../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg, ctx }: QuartzComponentProps) => {
  const root = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = ctx.argv.serve ? "/" : root.pathname
  const collections = (ctx.trie?.children ?? [])
    .filter((node) => node.isFolder && node.slugSegment !== "tags")
    .map((node) => ({
      title: node.displayName,
      slug: node.slug,
    }))

  return (
    <article class="popover-hint not-found">
      <p class="not-found-code">404</p>
      <h1>{i18n(cfg.locale).pages.error.title}</h1>
      <p>{i18n(cfg.locale).pages.error.notFound}</p>
      <button type="button" class="not-found-search" data-open-search>
        Buscar en el archivo
      </button>
      {collections.length > 0 ? (
        <nav class="not-found-collections" aria-label="Colecciones">
          <h2>Colecciones</h2>
          <ul>
            {collections.map((collection) => (
              <li>
                <a href={resolveRelative("404" as FullSlug, collection.slug as FullSlug)}>
                  {collection.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <a class="not-found-home" href={baseDir}>
        {i18n(cfg.locale).pages.error.home}
      </a>
      <script
        dangerouslySetInnerHTML={{
          __html: `
          const openSearch = () => {
            const button = document.querySelector(".sidebar .search-button, .search-button")
            if (button instanceof HTMLElement) button.click()
          }
          document.querySelectorAll("[data-open-search]").forEach((button) => {
            button.addEventListener("click", openSearch)
          })
          `,
        }}
      />
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
