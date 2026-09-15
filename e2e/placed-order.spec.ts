import { test, expect, type Page } from '@playwright/test'

/**
 * A freshly placed order must reach "Meine Apotheke" and its tracking page.
 *
 * The existing post-purchase specs only cover the four seeded demo orders, so
 * nothing locked the path a reviewer actually walks: buy something, then go
 * look for it under the account entry.
 */

const setPostcode = async (page: Page, postcode: string) => {
  await page.getByRole('button', { name: /Ihre PLZ|^\d{5}$/ }).first().click()
  await page.getByLabel('Postleitzahl').fill(postcode)
  await page.getByRole('button', { name: 'OK' }).click()
}

const placeAnOrder = async (page: Page) => {
  await page.goto('/product/voltaren')
  await setPostcode(page, '22083')
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await page.getByRole('button', { name: 'Zur Kasse' }).click()
  await page.getByRole('button', { name: 'Weiter zum Versand' }).click()
  await page.getByRole('button', { name: 'Weiter zur Zahlungsart' }).click()
  await page.getByRole('button', { name: 'Weiter zur Prüfung' }).click()
  await page.getByRole('button', { name: 'Zahlungspflichtig bestellen' }).click()
  await page.waitForURL('**/confirmation/**')

  const url = new URL(page.url())
  return url.pathname.split('/').pop() as string
}

test('the header account entry reaches the orders list', async ({ page }) => {
  await page.goto('/product/voltaren')

  await page.getByRole('link', { name: /Meine Apotheke/ }).click()

  await page.waitForURL('**/orders')
  await expect(page.getByText('Meine Bestellungen')).toBeVisible()
})

test('the checkout wordmark returns to the shop', async ({ page }) => {
  await page.goto('/product/voltaren')
  await setPostcode(page, '22083')
  await page.getByRole('button', { name: /In den Warenkorb/ }).click()
  await page.waitForURL('**/basket')
  await page.getByRole('button', { name: 'Zur Kasse' }).click()

  await page.getByRole('link', { name: 'Zur Startseite' }).click()

  await page.waitForURL('**/product/**')
  await expect(page.getByRole('button', { name: /In den Warenkorb/ })).toBeVisible()
})

test('a placed order appears in the orders list and can be tracked', async ({ page }) => {
  const orderId = await placeAnOrder(page)

  await page.getByRole('link', { name: /Meine Apotheke/ }).click()
  await page.waitForURL('**/orders')

  await expect(page.getByText(`Bestellung ${orderId}`)).toBeVisible()

  // The demo orders are still there alongside it.
  await expect(page.getByText('Bestellung 100421')).toBeVisible()

  await page
    .locator('.order-card')
    .filter({ hasText: `Bestellung ${orderId}` })
    .getByRole('link', { name: 'Sendung verfolgen' })
    .click()

  await page.waitForURL(`**/orders/${orderId}`)
  await expect(page.getByText(/Voraussichtliche Lieferung:/)).toBeVisible()
})

test('a placed order survives a page reload', async ({ page }) => {
  const orderId = await placeAnOrder(page)

  await page.goto('/orders')
  await expect(page.getByText(`Bestellung ${orderId}`)).toBeVisible()
})
