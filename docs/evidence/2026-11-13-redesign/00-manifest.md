# Cerebro Digital — cierre de rediseño

Fecha: 2026-11-13  
Repo: `D:\CODE\cerebro-digital-wiki`  
Node: v24.14.0 · npm: 11.9.0  
Documentos fuente: `docs/design/2026-11-12-cerebro-digital-hammock.md`, `docs/design/2026-11-12-cerebro-digital-spec.md`

## Resultado

Rediseño “Ceniza y Hierro” implementado en tres fases, sin editar el vault de contenido y sin agregar dependencias.

## Línea base

Build inicial medido con el contenido actual:

| Métrica | Baseline |
|---|---:|
| Lighthouse home mobile | 38 |
| LCP home mobile | 26,1 s |
| TBT home mobile | 1.111 ms |
| JS total gzip | 56.244 B |
| CSS total gzip | 62.632 B |
| Fuentes en caché | 262.420 B |
| Solicitudes frías | ~49–53 |
| Sitemap / RSS | presentes |
| Grafo / lector | presentes en todas las páginas |

## Resultado final

| Métrica | Final | Presupuesto |
|---|---:|---:|
| Lighthouse home mobile (mediana 3) | 99 | ≥90 |
| Lighthouse colección mobile (mediana 3) | 99 | ≥90 |
| Lighthouse nota mobile (mediana 3) | 95 | ≥90 |
| LCP home mobile | 1.773 ms | ≤2.500 ms |
| LCP colección mobile | 1.699 ms | ≤2.500 ms |
| LCP nota mobile | 2.459 ms | ≤2.500 ms |
| CLS (mediana) | 0 | ≤0,1 |
| TBT (mediana) | 0 ms | ≤200 ms |
| JS inicial gzip | 50.116 B | ≤55 KB |
| CSS total gzip | 14.893 B | ≤80 KB |
| Fuentes transferidas | 177.843 B / 6 archivos | ≤180 KB / 6 |
| Solicitudes frías (nota) | 29 | ≤30 |
| Portada WebP / AVIF | 101.214 B / 47.890 B | ≤200 KB |
| axe críticos / serios | 0 / 0 | 0 / 0 |

## Puertas ejecutadas

- `npm run check` — OK.
- `npm test` — 168 tests, 168 pass, 0 fail.
- `node quartz/bootstrap-cli.mjs build -d content --bundleInfo` — OK; 474 archivos de entrada, 1.456 archivos de salida.
- `npm run verify:synthetic` — 12 checks, incluido renombre/alta de colección.
- axe-core 4.14.0, 8 plantillas × 2 temas — 0 violaciones.
- Lighthouse 12, 3 corridas por página/modo — mediana registrada.
- 20 URLs representativas — 200/301 esperados; `/ruta-que-no-existe` 404.
- 60 capturas reales en 320/390/768/1024/1440/1920, claro/oscuro.
- `_redirects` probado con Wrangler: `/sitemap.xml` 301, `/excalidraw/*` 301, ruta inexistente 404 con 404 en español.
- Teclado, foco visible, Escape en búsqueda y drawer, movimiento reducido, impresión y sin JavaScript verificados.

## Decisiones de implementación

- Se reutilizan page-title, search, darkmode, explorer, article-title, TOC, backlinks, breadcrumbs, content-meta, note-properties, syntax highlighting y fonts de Quartz.
- El tema Obsidian por defecto (`@quartz-themes/core`) y el plugin `quartz-fonts` se desactivan: imponían tipografía/colores ajenos y 418 KB de CSS. Los tokens de Ceniza y Hierro viven en `quartz/styles/cerebro/` y `quartz.config.yaml`; no se reconstruyó ningún componente de Quartz.
- El CSS de componentes y plugins se agrupa en `index.css` para eliminar 20+ solicitudes render-blocking.
- La búsqueda y el explorador cargan su índice en la primera interacción; el árbol del explorador sigue server-rendered.
- Se normalizan títulos y H1 en build y se corrige cualquier página con 0 o 2+ H1, incluidas transclusiones y Excalidraw.
- `_redirects` conserva 200/301 para endpoints retirados y la ruta de Excalidraw.
- No se editó `content/`. La lista manual de la portada queda oculta por CSS; las colecciones se generan del contenido. Si se quiere eliminar del vault, es una edición de contenido separada.

## Archivos principales

- `quartz.config.yaml`, `quartz.ts`
- `quartz/components/Head.tsx`, `renderPage.tsx`, `pages/404.tsx`, `frames/*`
- `quartz/components/cerebro/` (`HomeIndex`, `BrandFooter`, `NoteFooter`, `Search`, `Explorer`, `explorerOptions`)
- `quartz/plugins/transformers/cerebro.ts`
- `quartz/plugins/pageTypes/folder.tsx`
- `quartz/plugins/emitters/deploy.ts`, `componentResources.ts`
- `quartz/styles/cerebro/*.scss`, `quartz/styles/custom.scss`
- `quartz/static/brand/*`, `quartz/static/fonts.css`, `quartz/static/icon.png`
- `quartz/util/cerebro.ts`, `symlink.ts`
- `scripts/*` de evidencia y verificación
- `test/fixtures/synthetic-content/*`

## Deuda residual

| Deuda | Dueño | Fecha objetivo | Estado |
|---|---|---|---|
| Alt text significativo de imágenes existentes (817 sin alt útil; el HTML emite alt vacío) | autor | 2026-12-31 | abierta, no bloqueante |
| 45 enlaces locales a PDF (preexistentes, excluidos del build) | autor | 2026-12-31 | abierta, no navegación primaria |
| 2 imágenes faltantes (`pasted-image-20260923…`) | autor | 2026-12-31 | placeholder activo |
| Wikilinks falsos en texto técnico (`[[data2]]`, etc.) | autor | 2026-12-31 | deuda de contenido |
| Una página HTML supera 40 KB gzip (contenido) | autor | 2026-12-31 | límite de contenido |
| Cadenas internas en inglés del plugin de búsqueda (`<title>Search</title>`, aria de resultados) | upstream / autor | 2026-12-31 | deuda menor; se localiza el chrome principal |
| Búsqueda de texto completo tarda ~4–6 s en la primera apertura por el índice de 4 MB | autor | 2026-12-31 | prefetch en hover/foco; no bloquea LCP/TBT |

No hay deuda crítica. La wiki sigue privada, detrás de Cloudflare Access, sin RSS, sitemap, OG, analytics, comentarios, cuentas ni página de grafo. No se agregaron dependencias.
