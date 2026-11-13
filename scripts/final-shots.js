;async (page) => {
  const base = "docs/evidence/2026-11-13-redesign/shots"
  const pages = [
    ["home", "http://localhost:8080/"],
    ["collection", "http://localhost:8080/01_universidad/"],
    [
      "note",
      "http://localhost:8080/01_universidad/administraci%C3%B3n-de-sistemas-de-informaci%C3%B3n/00---hub",
    ],
    ["404", "http://localhost:8080/404.html"],
  ]
  const widths = [320, 390, 768, 1024, 1440, 1920]
  const heights = { 320: 700, 390: 844, 768: 900, 1024: 900, 1440: 1000, 1920: 1080 }
  const report = []

  for (const theme of ["light", "dark"]) {
    await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" })
    await page.evaluate((value) => localStorage.setItem("theme", value), theme)

    for (const width of widths) {
      await page.setViewportSize({ width, height: heights[width] })
      for (const [name, url] of pages) {
        await page.goto(url, { waitUntil: "domcontentloaded" })
        await page.waitForTimeout(500)
        await page.evaluate(() => {
          history.scrollRestoration = "manual"
          window.scrollTo(0, 0)
        })
        await page.screenshot({ path: `${base}/${name}-${width}-${theme}.png` })
        report.push({
          name,
          width,
          theme,
          scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
        })
      }
    }

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" })
    await page.locator(".search-button").click()
    await page.waitForSelector(".search-container.active", { timeout: 15000 })
    await page.locator(".search-bar").fill("magnetismo")
    await page.waitForTimeout(500)
    for (const width of widths) {
      await page.setViewportSize({ width, height: heights[width] })
      await page.screenshot({ path: `${base}/search-${width}-${theme}.png` })
      report.push({
        name: "search",
        width,
        theme,
        scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
      })
    }
  }

  return report
}
