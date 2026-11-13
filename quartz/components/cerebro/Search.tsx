import { Search as QuartzSearch } from "@quartz-community/search"
import type { QuartzComponent, QuartzComponentProps } from "../types"

const base = QuartzSearch({
  enablePreview: true,
  fieldPriority: ["title", "content", "tags"],
})

const lazyInit = `(function () {
  let started = false;
  let initPromise = null;
  const init = () => {
    if (!started) {
      started = true;
      initPromise = Mn().then(() => {
        const localize = () => {
          document.querySelectorAll('.results-container[aria-label="Search results"]').forEach((element) => {
            element.setAttribute("aria-label", "Resultados de búsqueda");
          });
          document.querySelectorAll('.tag-suggestions[aria-label="Tag suggestions"]').forEach((element) => {
            element.setAttribute("aria-label", "Sugerencias de etiquetas");
          });
          document.querySelectorAll(".search-button svg title").forEach((element) => {
            element.textContent = "Buscar";
          });
        };
        localize();
        document.addEventListener("nav", localize);
        return undefined;
      });
    }
    return initPromise;
  };
  const start = (button) => init().then(() => {
    if (button) button.click();
  });
  const prefetch = () => {
    if (!started) init();
  };
  document.querySelectorAll(".search-button").forEach((button) => {
    button.addEventListener("pointerenter", prefetch, { once: true });
    button.addEventListener("focus", prefetch, { once: true });
    button.addEventListener("touchstart", prefetch, { once: true, passive: true });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      start(button);
    }, { capture: true, once: true });
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      start(document.querySelector(".search-button"));
    }
  }, { capture: true });
  document.addEventListener("nav", () => {
    if (started) Mn();
  });
  document.addEventListener("render", () => {
    if (started) Mn();
  });
})();`

export const LazySearch: QuartzComponent = (props: QuartzComponentProps) => base(props)
LazySearch.css = base.css

const script = typeof base.afterDOMLoaded === "string" ? base.afterDOMLoaded : ""
const marker = 'document.addEventListener("nav",Mn);document.addEventListener("render",Mn);'
LazySearch.afterDOMLoaded = script.includes(marker) ? script.replace(marker, lazyInit) : script

export default LazySearch
