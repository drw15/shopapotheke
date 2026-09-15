import { test, expect, type Page } from '@playwright/test'

/**
 * The checkout address step when the customer never entered a postcode.
 *
 * A reviewer who adds to basket straight from the PDP without setting a
 * postcode still reaches checkout, where the demo address claims Hamburg
 * 22083. Anything the address step offers has to agree with that address.
 */

const addWithoutPostcode = async (page: Page) => {
  await page.goto('/product/voltaren')
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await page.getByRole('button', { name: 'Zur Kasse' }).click()
  await page.waitForURL('**/checkout/address')
}

test('pickup stations are offered for the address actually shown', async ({ page }) => {
  await addWithoutPostcode(page)

  // The address step shows the demo address.
  await expect(page.getByText('22083 Hamburg')).toBeVisible()

  await page.getByRole('radio', { name: /Holen Sie Ihre Bestellung/ }).check()
  await page.getByRole('button', { name: /Wählen Sie einen Abholort|Anderen Abholort wählen/ }).click()

  // The picker must offer the stations for that same postcode.
  await expect(page.getByText('Waescherei Kinne')).toBeVisible()
  await expect(
    page.getByText('Für diese Postleitzahl sind keine Abholorte hinterlegt.'),
  ).toHaveCount(0)
})

test('a new delivery address can actually be entered', async ({ page }) => {
  await addWithoutPostcode(page)

  await page.getByRole('button', { name: 'An eine neue Lieferadresse' }).click()

  // The entry point must actually open a form.
  await expect(page.getByLabel('Postleitzahl')).toBeVisible()

  // A new postcode drives the prediction and the station lookup.
  await page.getByLabel('Postleitzahl').fill('50667')
  await page.getByRole('textbox', { name: 'Ort' }).fill('Köln')
  await page.getByRole('button', { name: 'Adresse übernehmen' }).click()

  await expect(page.getByText('50667 Köln')).toBeVisible()
})

const pickupThroughAddressStep = async (page: Page) => {
  await page.goto('/product/voltaren')
  await page.getByRole('button', { name: /Ihre PLZ|^\d{5}$/ }).first().click()
  await page.getByLabel('Postleitzahl').fill('22083')
  await page.getByRole('button', { name: 'OK' }).click()
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await page.getByRole('button', { name: 'Zur Kasse' }).click()

  await page.getByRole('radio', { name: /Holen Sie Ihre Bestellung/ }).check()
  await page.getByRole('button', { name: /Wählen Sie einen Abholort|Anderen Abholort wählen/ }).click()
}

test('every pickup station states its own delivery promise', async ({ page }) => {
  await pickupThroughAddressStep(page)

  // The station is the last delivery decision, so it carries the promise.
  const stations = page.locator('.pickup-station')
  await expect(stations).toHaveCount(3)
  await expect(stations.first().locator('.pickup-station__promise')).toBeVisible()
})

test('pickup goes straight to payment, with no second carrier choice', async ({ page }) => {
  await pickupThroughAddressStep(page)

  // Waescherei Kinne is a Hermes PaketShop.
  await page.getByText('Waescherei Kinne').click()
  await page.getByRole('button', { name: 'Abholstation übernehmen' }).click()

  // The carrier came with the station, so Versand has nothing left to ask.
  await expect(page.getByRole('button', { name: 'Weiter zum Versand' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Weiter zur Zahlungsart' }).click()

  await page.waitForURL('**/checkout/payment')
  await expect(page.getByText(/Standard mit (DHL|HERMES)/)).toHaveCount(0)
})
