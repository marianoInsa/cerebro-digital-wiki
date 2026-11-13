import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import HomeIndex from "./quartz/components/cerebro/HomeIndex"
import BrandFooter from "./quartz/components/cerebro/BrandFooter"
import NoteFooter from "./quartz/components/cerebro/NoteFooter"
import LazyExplorer from "./quartz/components/cerebro/Explorer"
import LazySearch from "./quartz/components/cerebro/Search"

type Layout = {
  defaults: any
  byPageType: Record<string, any>
}

const extendLayout = (layout: Layout): Layout => {
  const extend = (value: any) => {
    const left = value?.left ?? []
    return {
      ...value,
      left: [left[0], LazySearch, ...left.slice(1), LazyExplorer].filter(Boolean),
      beforeBody: [HomeIndex, ...(value?.beforeBody ?? [])],
      afterBody: [...(value?.afterBody ?? []), NoteFooter],
      footer: [BrandFooter],
    }
  }
  const byPageType: Record<string, any> = {}
  for (const [key, value] of Object.entries(layout.byPageType ?? {})) {
    byPageType[key] = extend(value)
  }
  return { defaults: extend(layout.defaults), byPageType }
}

const config = await loadQuartzConfig(undefined, extendLayout)
export default config
export const layout = extendLayout(await loadQuartzLayout())
