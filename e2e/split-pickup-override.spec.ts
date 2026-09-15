import { test, expect, type Page } from '@playwright/test'

/**
 * Scenario 3.5: switching one shipment of a split order to pickup.
 *
 * The order-level rule holds per shipment too. A parcel shop belongs to one
 * carrier, so a shipment sent to a station has no carrier left to choose - and
 * the other shipment, still going home, must keep its own choice.
 */

const splitCheckoutAtShipping = async (page: Page) => {
  await page.goto('/product/voltaren')
  await page.getByRole('button', { name: /Ihre PLZ|^\d{5}$/ }).first().click()
  await page.getByLabel('Postleitzahl').fill('22083')
  await page.getByRole('button', { name: 'OK' }).click()
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')

  await page
    .locator('.suggestion-card')
    .filter({ has: page.locator('a[href="/product/bepanthen"]') })
    .locator('.suggestion-card__add')
    .click()

  await page.getByRole('button', { name: 'Zur Kasse' }).click()
  await page.getByRole('button', { name: 'Weiter zum Versand' }).click()
  await expect(page.locator('.shipping-block')).toHaveCount(2)
}

const overrideFirstShipmentToPickup = async (page: Page) => {
  await page.locator('.shipping-block').first().getByRole('button', { name: 'Lieferart ändern' }).click()
  await page.getByLabel('An einen Abholort').click()
  await page.getByText('Waescherei Kinne').click()
  await page.getByRole('button', { name: 'Abholstation übernehmen' }).click()
}

test('a shipment switched to pickup shows its station, not a carrier choice', async ({ page }) => {
  await splitCheckoutAtShipping(page)
  await overrideFirstShipmentToPickup(page)

  const pickupBlock = page.locator('.shipping-block').first()

  // The row names the station the customer chose.
  await expect(pickupBlock.locator('.carrier-option__label')).toHaveText('Waescherei Kinne')

  // Not a carrier, under any name: the question has no second answer.
  await expect(pickupBlock.locator('input[type="radio"][name^="provider-"]')).toHaveCount(0)
  await expect(pickupBlock.getByText(/Standard mit (DHL|HERMES)/)).toHaveCount(0)
})

test('the other shipment keeps its own carrier choice', async ({ page }) => {
  await splitCheckoutAtShipping(page)
  await overrideFirstShipmentToPickup(page)

  const homeBlock = page.locator('.shipping-block').nth(1)

  // Still going home, so both carriers remain on offer for it.
  await expect(homeBlock.getByText('Standard mit DHL')).toBeVisible()
  await expect(homeBlock.getByText('Standard mit HERMES')).toBeVisible()
  await expect(homeBlock.locator('input[type="radio"][name^="provider-"]')).toHaveCount(2)
})

test('the pickup shipment still states a delivery promise', async ({ page }) => {
  await splitCheckoutAtShipping(page)
  await overrideFirstShipmentToPickup(page)

  const pickupBlock = page.locator('.shipping-block').first()
  await expect(
    pickupBlock.getByText(/Lieferzeitraum:|Lieferung in 1–3 Werktagen/),
  ).toBeVisible()
})
