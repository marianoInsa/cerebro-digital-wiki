;async (page) => {
  const pages = [
    ["home", "/"],
    ["collection", "/01_universidad/"],
    ["note", "/01_universidad/administraci%C3%B3n-de-sistemas-de-informaci%C3%B3n/00---hub"],
    ["404", "/404.html"],
  ]
  const widths = [
    [390, 844],
    [1440, 900],
  ]
  const themes = ["light", "dark"]
  const base = "docs/evidence/2026-11-13-redesign/baseline/shots"
  const errors = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`${page.url()} :: ${msg.text()}`)
  })
  for (const theme of themes) {
    await page.emulateMedia({ colorScheme: theme })
    for (const [width, height] of widths) {
      await page.setViewportSize({ width, height })
      for (const [name, url] of pages) {
        await page.goto(`http://localhost:8080${url}`, { waitUntil: "networkidle" })
        await page.screenshot({ path: `${base}/${name}-${width}-${theme}.png` })
      }
      await page.goto("http://localhost:8080/", { waitUntil: "networkidle" })
      await page.locator(".search-button").click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${base}/search-${width}-${theme}.png` })
      await page.keyboard.press("Escape")
    }
  }
  return { shots: pages.length * widths.length * themes.length + 4, errors }
}
