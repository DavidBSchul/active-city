import { test, expect, type Page } from '@playwright/test'

const placeName = 'Centrum Sportu Parkowa street workout'
const localOrigin = 'http://127.0.0.1:4173'
// A transparent 1×1 PNG keeps Leaflet working without downloading map tiles.
const blankTile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')

for (const width of [375, 390, 768, 1440]) {
  test(`core controls fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.reload()
    const expectNoOverflow = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    }
    await expectNoOverflow()
    await page.keyboard.press('Tab')
    const foundationLink = page.getByRole('link', { name: /Foundation home|Fundacja Życie, Razem home/ })
    await expect(foundationLink).toBeFocused()
    expect(await foundationLink.evaluate((link) => link.getBoundingClientRect().height)).toBeGreaterThanOrEqual(24)
    await expect(page.getByRole('navigation', { name: 'Main sections' }).getByRole('link')).toHaveCount(4)
    await openContributions(page)
    const reportSelects = page.locator('.place-report-form select')
    for (const select of await reportSelects.all()) {
      expect(await select.evaluate((control) => control.getBoundingClientRect().height)).toBeGreaterThanOrEqual(24)
    }
    await expectNoOverflow()
    await page.getByRole('link', { name: 'Plan', exact: true }).click()
    await page.getByRole('button', { name: 'Make today’s plan', exact: true }).click()
    await expectNoOverflow()
    const button = await page.getByRole('button', { name: 'Make today’s plan', exact: true }).boundingBox()
    expect(button).not.toBeNull()
    expect(button!.x).toBeGreaterThanOrEqual(0)
    expect(button!.x + button!.width).toBeLessThanOrEqual(width)
  })
}

async function selectPlace(page: Page) {
  await page.getByRole('button', { name: `${placeName} Outdoor gym and sports complex`, exact: true }).click()
  await expect(page.getByRole('heading', { name: placeName, exact: true })).toBeVisible()
}

async function openContributions(page: Page) {
  await selectPlace(page)
  await page.getByText('Help keep this place up to date', { exact: true }).click()
}

test.beforeEach(async ({ context, page }) => {
  // Only the test server is allowed through. No geocoder, router, analytics,
  // source links, or other remote service can receive a real browser request.
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === localOrigin) return route.continue()
    if (/^[abc]\.tile\.openstreetmap\.org$/.test(url.hostname)) {
      return route.fulfill({ contentType: 'image/png', body: blankTile })
    }
    return route.abort('blockedbyclient')
  })
  page.on('pageerror', (error) => { throw error })
  await page.goto('./')
})

test('opens Explore through navigation and a direct URL', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Krakow recreation spaces' })).toBeVisible()
  await expect(page.locator('.location-list').getByRole('button')).toHaveCount(14)
  await expect(page.getByLabel('Interactive map of Krakow recreation spaces')).toBeVisible()
  await page.getByRole('link', { name: 'Plan', exact: true }).click()
  await page.getByRole('link', { name: 'Explore', exact: true }).click()
  await expect(page).toHaveURL(/\?view=explore$/)
  await expect(page.getByRole('link', { name: 'Explore', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Browse by location' })).toBeVisible()
})

test('selects a location using the map text alternative', async ({ page }) => {
  await selectPlace(page)
  await expect(page.getByRole('button', { name: `${placeName} Outdoor gym and sports complex`, exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('article', { name: placeName })).toContainText('Pull-up bars, parallel bars, ladders')
  await page.getByRole('link', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Choose a place')).toHaveValue('parkowa-street-workout')
})

test('makes a Today plan without geocoding or routing', async ({ page }) => {
  await selectPlace(page)
  await page.getByRole('link', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Activity at this place').selectOption('Bodyweight strength')
  await page.getByLabel('Total time available').selectOption('45')
  await page.getByRole('button', { name: 'Make today’s plan', exact: true }).click()
  await expect(page.getByRole('heading', { name: `Bodyweight strength at ${placeName}`, exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '45 minutes to get moving' })).toBeVisible()
  await expect(page.getByText('For now, here is a 45-minute movement outline without travel time.', { exact: false })).toBeVisible()
  await expect(page.locator('.today-session-outline li')).toHaveCount(4)
  await page.getByRole('button', { name: 'I’m back — reflect' }).click()
  await expect(page).toHaveURL(/\?view=week$/)
  await expect(page.locator('.checkin-location')).toContainText(placeName)
})

test('saves a private place-condition report only in the current tab', async ({ page }) => {
  await openContributions(page)
  await page.getByLabel('Equipment today').selectOption('attention')
  await page.getByRole('combobox', { name: /^Place description/ }).selectOption('partly-accurate')
  await page.getByLabel('How busy was it?').selectOption('quiet')
  await page.getByLabel('Visitor mix (broad terms only)').selectOption('families-mixed')
  await page.getByLabel('Optional note', { exact: true }).fill('Two exercise stations were unavailable.')
  await page.getByRole('button', { name: 'Save private report' }).click()
  await expect(page.getByRole('status').filter({ hasText: `Saved privately for ${placeName}. It has not changed the public map.` })).toBeVisible()
  await expect(page.getByText('1 private report saved for this place in this browser tab.', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Optional note', { exact: true })).toBeEmpty()
  await page.getByRole('link', { name: 'Plan', exact: true }).click()
  await page.getByRole('link', { name: 'Explore', exact: true }).click()
  await expect(page.getByText('1 private report saved for this place in this browser tab.', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({})
  await page.reload()
  await openContributions(page)
  await expect(page.getByText('1 private report saved for this place in this browser tab.', { exact: true })).toHaveCount(0)
  await expect(page.locator('.location-list').getByRole('button')).toHaveCount(14)
})

test('requires acknowledgement and prepares a private public-place suggestion', async ({ page }) => {
  await openContributions(page)
  await page.getByText('Suggest a missing public place', { exact: true }).click()
  await page.getByRole('button', { name: 'Prepare contributor review' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Please confirm the public-place and privacy statement first.' })).toBeVisible()
  await expect(page.getByLabel('Place name', { exact: true })).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'I am 18+ and will suggest only a public outdoor place.', exact: false }).check()
  await page.getByRole('button', { name: 'Prepare contributor review' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'No identity documents are requested or checked here.' })).toBeVisible()
  await page.getByLabel('Place name', { exact: true }).fill('Smoke test public park')
  await page.getByLabel('Public park or nearest street').fill('Public park test area')
  await page.getByLabel('Type of place').selectOption('Park and open space')
  await page.getByLabel('Public source or map link').fill('https://example.com/public-park')
  await page.getByRole('button', { name: 'Save map suggestion' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Suggestion saved privately in this browser.' })).toBeVisible()
  await expect(page.getByText('1 private map suggestion saved in this browser tab.', { exact: true })).toBeVisible()
  await expect(page.locator('.location-list').getByRole('button')).toHaveCount(14)
  await expect(page.getByRole('button', { name: /Smoke test public park/ })).toHaveCount(0)
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({})
  await page.reload()
  await openContributions(page)
  await page.getByText('Suggest a missing public place', { exact: true }).click()
  await expect(page.getByText('1 private map suggestion saved in this browser tab.', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'I am 18+ and will suggest only a public outdoor place.', exact: false })).not.toBeChecked()
  await expect(page.getByLabel('Place name', { exact: true })).toHaveCount(0)
})
