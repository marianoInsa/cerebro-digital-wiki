;async (page) => {
  const axeUrl = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.14.0/axe.min.js"
  const results = []
  const runAxe = async (name, theme) => {
    await page.addScriptTag({ url: axeUrl })
    const violations = await page.evaluate(async () => {
      const report = await axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      })
      return report.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
      }))
    })
    results.push({ name, theme, violations })
  }

  const setTheme = async (theme) => {
    await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" })
    await page.evaluate((value) => localStorage.setItem("theme", value), theme)
  }

  for (const theme of ["light", "dark"]) {
    await setTheme(theme)
    await page.setViewportSize({ width: 1440, height: 1000 })

    for (const [name, url] of [
      ["home", "http://localhost:8080/"],
      ["collection", "http://localhost:8080/01_universidad/"],
      ["subcollection", "http://localhost:8080/01_universidad/devops/"],
      [
        "note",
        "http://localhost:8080/01_universidad/administraci%C3%B3n-de-sistemas-de-informaci%C3%B3n/00---hub",
      ],
      ["404", "http://localhost:8080/404.html"],
    ]) {
      await page.goto(url, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(400)
      await runAxe(name, theme)
    }

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" })
    await page.locator(".search-button").click()
    await page.waitForSelector(".search-container.active", { timeout: 15000 })
    await runAxe("search", theme)

    await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" })
    await page.locator(".mobile-explorer").click()
    await page.waitForTimeout(3500)
    await runAxe("drawer", theme)

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(
      "http://localhost:8080/01_universidad/administraci%C3%B3n-de-sistemas-de-informaci%C3%B3n/00---hub",
      { waitUntil: "domcontentloaded" },
    )
    await page.locator("article a.internal-link").first().hover()
    await page.waitForTimeout(700)
    await runAxe("popover", theme)
  }

  return results
}
