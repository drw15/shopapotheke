import { test, expect, type Page } from '@playwright/test'

/**
 * The pre-purchase demo journey.
 *
 * These lock the walkthrough itself: if a change breaks the story the reviewer
 * is shown, these fail rather than the presenter discovering it live.
 */

const setPostcode = async (page: Page, postcode: string) => {
  await page.getByRole('button', { name: /Ihre PLZ|^\d{5}$/ }).first().click()
  await page.getByLabel('Postleitzahl').fill(postcode)
  await page.getByRole('button', { name: 'OK' }).click()
}

const addFromBasketSuggestions = async (page: Page, productId: string) => {
  await page
    .locator('.suggestion-card')
    .filter({ has: page.locator(`a[href="/product/${productId}"]`) })
    .locator('.suggestion-card__add')
    .click()
}

test('PDP becomes precise once a supported postcode is known', async ({ page }) => {
  await page.goto('/product/voltaren')
  await expect(page.getByText('Lieferung in 1–3 Werktagen')).toBeVisible()

  await setPostcode(page, '50667')

  await expect(page.getByText(/Voraussichtliche Lieferung:/)).toBeVisible()
  await expect(page.getByText('Lieferung in 1–3 Werktagen')).toHaveCount(0)
})

test('a documented unsafe combination falls back without explanation', async ({ page }) => {
  await page.goto('/product/ibu')
  await setPostcode(page, '80331')

  await expect(page.getByText('Lieferung in 1–3 Werktagen')).toBeVisible()
  // The customer is never told which gate failed.
  await expect(page.locator('body')).not.toContainText(/Konfidenz|Modell|nicht verfügbar/i)
})

test('the basket reveals a material split and hides a non-material one', async ({ page }) => {
  // The canonical basket from the design: the second shipment has no model
  // coverage, so it shows the broad promise - which is still a delivery window
  // and is compared on the dates behind it.
  await page.goto('/product/voltaren')
  await setPostcode(page, '50667')
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await addFromBasketSuggestions(page, 'vagisan')

  // Köln: shipment 1 arrives materially earlier.
  await expect(page.getByText(/kommt in 2 Lieferungen/)).toBeVisible()
  await expect(page.getByText('Lieferung 1 von 2')).toBeVisible()

  // Berlin: both shipments land together, so the split is not worth showing
  // and the basket falls back to a single order-level promise. It is the broad
  // one here, because an unpredictable product widens the whole envelope.
  await setPostcode(page, '10115')
  await expect(page.getByText(/kommt in 2 Lieferungen/)).toHaveCount(0)
  await expect(page.getByText('Lieferung in 1–3 Werktagen').first()).toBeVisible()
})

test('a split with two predicted shipments shows concrete dates for both', async ({ page }) => {
  await page.goto('/product/voltaren')
  await setPostcode(page, '50667')
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await addFromBasketSuggestions(page, 'bepanthen')

  await expect(page.getByText(/kommt in 2 Lieferungen/)).toBeVisible()
  // Both shipment rows carry a date rather than the broad promise.
  await expect(page.locator('.basket-split .delivery-estimate__label')).toHaveCount(2)
  await expect(page.locator('.basket-split')).not.toContainText('Lieferung in 1–3 Werktagen')
})

test('checkout offers DHL and Hermes with their own delivery windows', async ({ page }) => {
  await page.goto('/product/voltaren')
  await setPostcode(page, '22083')
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await page.getByRole('button', { name: 'Zur Kasse' }).click()
  await page.getByRole('button', { name: 'Weiter zum Versand' }).click()

  await expect(page.getByText('Standard mit DHL')).toBeVisible()
  await expect(page.getByText('Standard mit HERMES')).toBeVisible()
  await expect(page.getByText(/Lieferzeitraum:/)).toHaveCount(2)
  await expect(page.locator('body')).not.toContainText(/DPD/i)
})

test('a split order keeps both shipments on one step and isolates an override', async ({ page }) => {
  await page.goto('/product/voltaren')
  await setPostcode(page, '22083')
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await addFromBasketSuggestions(page, 'bepanthen')
  await page.getByRole('button', { name: 'Zur Kasse' }).click()
  await page.getByRole('button', { name: 'Weiter zum Versand' }).click()

  await expect(page.locator('.shipping-block')).toHaveCount(2)

  // Both inherit the order-level destination.
  const destinations = page.locator('.shipment-header__destination')
  await expect(destinations.nth(0)).toContainText('Musterstraße')
  await expect(destinations.nth(1)).toContainText('Musterstraße')

  // Change shipment 1 to pickup only.
  await page.locator('.shipping-block').first().getByRole('button', { name: 'Lieferart ändern' }).click()
  await page.getByLabel('An einen Abholort').click()
  await page.getByRole('button', { name: 'Abholstation übernehmen' }).click()

  await expect(destinations.nth(0)).toContainText('Waescherei Kinne')
  await expect(destinations.nth(1)).toContainText('Musterstraße')
})

test('confirmation freezes the promise the checkout showed', async ({ page }) => {
  await page.goto('/product/voltaren')
  await setPostcode(page, '22083')
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await page.getByRole('button', { name: 'Zur Kasse' }).click()
  await page.getByRole('button', { name: 'Weiter zum Versand' }).click()

  const shippingPromise = await page.locator('.carrier-option__promise').first().innerText()
  const window = shippingPromise.replace('Lieferzeitraum: ', '').trim()

  await page.getByRole('button', { name: 'Weiter zur Zahlungsart' }).click()
  await page.getByRole('button', { name: 'Weiter zur Prüfung' }).click()
  await page.getByRole('button', { name: 'Zahlungspflichtig bestellen' }).click()
  await page.waitForURL('**/confirmation/**')

  await expect(page.getByText(`Zugesagte Lieferung: ${window}`)).toBeVisible()
})
