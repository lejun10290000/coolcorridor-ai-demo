// Production-only smoke/security checks. Each run uses fresh, isolated browser storage.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const base = (process.env.ALIGNMENT_APP_URL || 'http://127.0.0.1:4183').replace(/\/$/, '')
const out = path.resolve(process.env.SECURITY_OUTPUT_DIR || 'outputs/public-deployment')
const key = 'coolcorridor-shade-workflow-v1'
;(async () => {
  await fs.mkdir(out, { recursive: true })
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    const errors = [], violations = []
    context.on('page', p => { p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message)) })
    await context.addInitScript(() => {
      window.securityViolations = []
      window.addEventListener('securitypolicyviolation', e => window.securityViolations.push({ directive: e.effectiveDirective, blocked: e.blockedURI }))
    })
    const resident = await context.newPage(), developer = await context.newPage()
    const response = await resident.goto(base + '/')
    assert.equal(response.status(), 200)
    const headers = await response.allHeaders()
    const csp = headers['content-security-policy'] || ''
    for (const policy of ["default-src 'none'", "script-src 'self'", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'"]) assert.ok(csp.includes(policy), policy)
    assert.ok(!csp.includes('unsafe-eval'))
    assert.equal(headers['x-content-type-options'], 'nosniff')
    assert.equal(headers['x-frame-options'], 'DENY')
    assert.equal(headers['referrer-policy'], 'no-referrer')
    assert.ok(headers['permissions-policy'].includes('geolocation=()'))
    if (base.startsWith('https:')) assert.match(headers['strict-transport-security'], /max-age=\d+/)
    const paths = ['/.env', '/.env.local', '/.git/config', '/package.json', '/src/main.tsx', '/@vite/client', '/review/check-public-deployment.cjs']
    const probes = []
    for (const endpoint of paths) {
      const result = await context.request.get(base + endpoint)
      assert.equal(result.status(), 404, `Internal file exposed: ${endpoint}`)
      probes.push({ path: endpoint, status: result.status() })
    }
    async function enter(page, role) {
      if (page !== resident || !page.url().endsWith('/')) await page.goto(base + '/')
      await page.getByLabel('Visual quality').selectOption('fallback')
      await page.getByRole('button', { name: `Enter ${role} Mode`, exact: true }).click()
      await page.locator('.campus-map-overlay').waitFor()
    }
    await enter(resident, 'Resident'); await enter(developer, 'Developer')
    const photoErrors = await resident.locator('.campus-map-scene img').evaluateAll(images => images.filter(i => !i.complete || i.naturalWidth === 0).length)
    assert.equal(photoErrors, 0)
    await resident.getByLabel('Starting point', { exact: true }).selectOption('MAIN-GATE')
    await resident.getByLabel('Destination', { exact: true }).selectOption('INNER-GATE')
    const card = resident.locator('[data-route-objective="shortest"]')
    const segments = await card.getAttribute('data-route-segments')
    assert.ok(segments)
    await resident.getByRole('button', { name: /Start selected route/ }).click()
    await resident.getByRole('region', { name: 'Step-by-step walk', exact: true }).waitFor()
    assert.equal(await resident.locator('.resident-walk-panel').getAttribute('data-walk-segments'), segments)
    await resident.getByRole('button', { name: 'Next point →', exact: true }).click()
    await resident.getByRole('heading', { name: 'Beautifully done.', exact: true }).waitFor()
    await resident.getByRole('button', { name: 'Back to route selection', exact: true }).click()
    await resident.getByRole('button', { name: 'Select path on map', exact: true }).click()
    for (const id of ['MAIN-GATE', 'INNER-GATE']) {
      await resident.locator(`[data-campus-node-id="${id}"]`).focus()
      await resident.keyboard.press('Enter')
    }
    const dialog = resident.getByRole('dialog', { name: 'Report a walkway problem', exact: true })
    await dialog.waitFor()
    await resident.getByRole('button', { name: 'Continue to describe →', exact: true }).click()
    const payload = '<img src=x onerror="window.__reportXss=1"> Security regression sample'
    await resident.getByLabel('Describe the problem', { exact: true }).fill(payload)
    await resident.getByLabel('Optional report photo', { exact: true }).setInputFiles({ name: 'active.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>') })
    await dialog.getByRole('alert').waitFor()
    assert.equal(await resident.getByRole('button', { name: 'Review report →', exact: true }).isEnabled(), false)
    await resident.getByRole('button', { name: 'Continue without photo', exact: true }).click()
    await resident.getByRole('button', { name: 'Review report →', exact: true }).click()
    await resident.getByRole('button', { name: 'Submit route report →', exact: true }).click()
    await resident.getByRole('button', { name: /Back to map/ }).click()
    await developer.getByRole('tab', { name: /Resident reports/ }).click()
    const record = developer.locator('[data-report-id]').first()
    await record.getByText(payload, { exact: true }).waitFor()
    assert.equal(await record.locator('img[src="x"]').count(), 0)
    assert.equal(await developer.evaluate(() => window.__reportXss), undefined)
    const reportId = await record.getAttribute('data-report-id')
    const before = await resident.evaluate(k => JSON.parse(localStorage.getItem(k)).current_version, key)
    await record.getByLabel(`Report review note — ${reportId}`, { exact: true }).fill('Synthetic deployment review: reject without changing shade.')
    await record.getByRole('button', { name: 'Reject report', exact: true }).click()
    assert.equal(await resident.evaluate(k => JSON.parse(localStorage.getItem(k)).current_version, key), before)
    for (const page of [resident, developer]) {
      await page.setViewportSize({ width: 390, height: 844 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      violations.push(...await page.evaluate(() => window.securityViolations))
    }
    assert.deepEqual(violations, [], 'Normal workflows must not violate CSP')
    assert.deepEqual(errors, [])
    await resident.screenshot({ path: path.join(out, 'resident-mobile.png'), fullPage: true })
    // An intentionally injected inline script must be blocked by the delivered CSP.
    await resident.evaluate(() => { const script = document.createElement('script'); script.textContent = 'window.__inlineProbe = 1'; document.head.append(script) })
    await resident.waitForFunction(() => window.securityViolations.some(v => v.directive === 'script-src-elem'))
    assert.equal(await resident.evaluate(() => window.__inlineProbe), undefined)
    const result = { status: 'passed', base, headers, probes, checks: ['security headers delivered', 'internal/source/dev endpoints return 404', 'map and route render under CSP', 'walkthrough completes', 'active SVG upload rejected', 'report text is escaped', 'report rejection preserves map version', 'both modes fit mobile viewport', 'normal flows have no CSP violations or page errors', 'CSP blocks inline script execution'], pageErrors: errors }
    await fs.writeFile(path.join(out, 'browser-results.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify(result, null, 2))
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exit(1) })
