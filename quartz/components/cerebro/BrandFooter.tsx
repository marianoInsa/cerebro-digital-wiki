import { h } from "preact"
import type { QuartzComponent, QuartzComponentProps } from "../types"

const imageFallbackScript = `
const bindImageFallbacks = () => {
  document.querySelectorAll("article img").forEach((img) => {
    if (img.dataset.fallbackBound === "true") return
    img.dataset.fallbackBound = "true"
    const replace = () => {
      if (!img.isConnected) return
      const span = document.createElement("span")
      span.className = "image-missing"
      span.textContent = img.getAttribute("alt") || "Imagen no disponible"
      img.replaceWith(span)
    }
    img.addEventListener("error", replace, { once: true })
    if (img.complete && img.naturalWidth === 0) replace()
  })
}
const bindTableFocus = () => {
  document.querySelectorAll(".table-container").forEach((table) => {
    if (table.hasAttribute("tabindex")) return
    table.setAttribute("tabindex", "0")
    table.setAttribute("role", "region")
    table.setAttribute("aria-label", "Tabla con desplazamiento horizontal")
  })
}
const localizeChrome = () => {
  document.querySelectorAll('nav[aria-label="breadcrumbs"]').forEach((element) => {
    element.setAttribute("aria-label", "Migas de pan")
  })
}
document.addEventListener("nav", () => {
  bindImageFallbacks()
  bindTableFocus()
  localizeChrome()
})
bindImageFallbacks()
bindTableFocus()
localizeChrome()
`

export const BrandFooter: QuartzComponent = (_props: QuartzComponentProps) => {
  return h("footer", { class: "brand-footer" }, [h("p", {}, "Cerebro Digital · Hecho con Quartz")])
}

BrandFooter.afterDOMLoaded = imageFallbackScript

export default BrandFooter
