import { test, expect } from '@playwright/test'

/** Post-purchase: the promise-versus-ETA story and proactive communication. */

test('an on-time order gets no exception treatment', async ({ page }) => {
  await page.goto('/orders/100421')

  await expect(page.getByText(/Voraussichtliche Lieferung:/)).toBeVisible()
  await expect(page.getByText('Ihre Lieferung verspätet sich')).toHaveCount(0)
})

test('a delayed order shows the new date and keeps the original promise', async ({ page }) => {
  await page.goto('/orders/100422')

  await expect(page.getByText('Ihre Lieferung verspätet sich')).toBeVisible()
  await expect(page.getByText(/Neuer Liefertermin:/)).toBeVisible()
  // The promise is not silently rewritten.
  await expect(page.getByText(/Ursprünglich angekündigt:/)).toBeVisible()
})

test('split shipments track independently', async ({ page }) => {
  await page.goto('/orders/100423')

  await expect(page.locator('.tracking-card')).toHaveCount(2)
  await expect(page.getByText(/Zugestellt am/)).toBeVisible()
  await expect(page.getByText(/Voraussichtliche Lieferung:/)).toBeVisible()
})

test('the delay email shows exactly the dates tracking shows', async ({ page }) => {
  await page.goto('/orders/100422')

  const newEta = (await page.locator('.tracking-delay__eta').innerText())
    .replace('Neuer Liefertermin:', '')
    .trim()
  const original = (await page.locator('.tracking-delay__original').innerText())
    .replace('Ursprünglich angekündigt:', '')
    .trim()

  await page.goto('/email-preview/100422')

  await expect(page.locator('.email__eta')).toHaveText(newEta)
  await expect(page.locator('.email__original')).toContainText(original)
})

test('no delay email is offered for an order that is on time', async ({ page }) => {
  await page.goto('/email-preview/100421')
  await expect(page.getByText(/keine Verspätungsbenachrichtigung nötig/)).toBeVisible()
})

test('the orders list exposes all four demo orders', async ({ page }) => {
  await page.goto('/orders')

  for (const id of ['100421', '100422', '100423', '100424']) {
    await expect(page.getByText(`Bestellung ${id}`)).toBeVisible()
  }
})
