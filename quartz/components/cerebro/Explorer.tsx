import { Explorer as QuartzExplorer } from "@quartz-community/explorer"
import type { QuartzComponent, QuartzComponentProps } from "../types"
import { explorerOptions } from "./explorerOptions"

const base = QuartzExplorer(explorerOptions as any)

const lazyInit = `(function () {
  const fixAria = () => {
    document.querySelectorAll(".explorer[aria-expanded]").forEach((element) => {
      element.removeAttribute("aria-expanded");
    });
  };
  fixAria();
  const observer = new MutationObserver(fixAria);
  observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["aria-expanded"] });
  let started = false;
  let initPromise = null;
  const init = () => {
    if (!started) {
      started = true;
      initPromise = L({ detail: { url: location.pathname } }).then(() => {
        fixAria();
      });
    }
    return initPromise;
  };
  const start = (button) =>
    init().then(() => {
      fixAria();
      if (button) button.click();
    });
  const prefetch = () => {
    if (!started) init();
  };
  document.querySelectorAll(".explorer, .explorer-toggle").forEach((element) => {
    element.addEventListener("pointerenter", prefetch, { once: true });
    element.addEventListener("focus", prefetch, { once: true });
    element.addEventListener("touchstart", prefetch, { once: true, passive: true });
  });
  document.querySelectorAll(".explorer-toggle").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      start(button);
    }, { capture: true, once: true });
  });
  document.addEventListener("nav", (event) => {
    if (started) L(event);
  });
  document.addEventListener("render", (event) => {
    if (started) L(event);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!document.documentElement.classList.contains("mobile-no-scroll")) return;
    const toggle = document.querySelector(".mobile-explorer");
    if (toggle) {
      toggle.focus();
      toggle.click();
    }
  });
})();`

export const LazyExplorer: QuartzComponent = (props: QuartzComponentProps) => base(props)
LazyExplorer.css = base.css

const script = typeof base.afterDOMLoaded === "string" ? base.afterDOMLoaded : ""
const marker = 'document.addEventListener("nav",L);document.addEventListener("render",L);'
LazyExplorer.afterDOMLoaded = script.includes(marker) ? script.replace(marker, lazyInit) : script

export default LazyExplorer
