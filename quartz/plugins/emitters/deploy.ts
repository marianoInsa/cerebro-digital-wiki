import type { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import type { FullSlug } from "../../util/path"

const REDIRECTS = `# Rutas retiradas o utilitarias: 301 al inicio, nunca 404.
/sitemap.xml / 301
/index.xml / 301
/excalidraw/* / 301
`

export const CerebroDeploy: QuartzEmitterPlugin = () => ({
  name: "CerebroDeploy",
  async emit(ctx) {
    const file = await write({
      ctx,
      slug: "_redirects" as FullSlug,
      ext: "",
      content: REDIRECTS,
    })
    return [file]
  },
})

export default CerebroDeploy
