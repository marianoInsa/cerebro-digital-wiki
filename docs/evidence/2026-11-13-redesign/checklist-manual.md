# Checklist manual

Fecha: 2026-11-13

- Teclado: 12 paradas desde portada; skip link, búsqueda, tema, explorador y enlaces con foco visible de 2 px (`rgb(227,154,140)` en oscuro).
- Búsqueda: `Ctrl+K` abre; foco en el campo; `Escape` cierra y devuelve foco.
- Drawer mobile: hamburguesa visible en 320/390; abre el árbol; `Escape` cierra y devuelve foco al botón.
- Movimiento reducido: `transition-duration: 1e-05s`, `scroll-behavior: auto`.
- Impresión: fondo blanco, texto negro; sidebar, TOC, búsqueda, footer y navegación ocultos; tablas/código sin recorte involuntario.
- Sin JavaScript: nota renderizada con título, un H1, 11 enlaces y contenido; navegación por colecciones y breadcrumb disponible. Búsqueda y drawer degradan (sin índice dinámico).
- Reflow: `scrollWidth === innerWidth` en 320, 390, 768, 1024, 1440 y 1920 para portada, colección, nota, búsqueda y 404.
- Zoom: se validó reflow a 320 px como caso equivalente de anchura efectiva; sin scroll horizontal de página.
- Targets: axe `target-size` sin violaciones; enlaces de TOC/backlinks con min-height 24 px.
- Tablas: `.table-container` con `overflow-x:auto` y `tabindex=0`/`role=region`; scroll interno, no de página.
- Código: `pre` con scroll horizontal; fondo hundido y botón de copiar.
- Imágenes: dimensiones y `aspect-ratio` explícitos; lazy; placeholder al fallar.
- 20 URLs: 200/301; ruta inexistente 404 con 404 en español.
- Redirecciones de producción con Wrangler: `/sitemap.xml` 301, `/excalidraw/foo` 301, ruta inexistente 404.
