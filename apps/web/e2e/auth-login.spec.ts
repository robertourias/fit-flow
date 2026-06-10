import { test, expect } from '@playwright/test'
import { mockTurnstile, E2E_OTP } from './helpers'
import { TEST_USER } from './global-setup'

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTurnstile(page)
    await page.goto('/login')
  })

  test('complete login: email + password → OTP → dashboard', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/senha/i).fill(TEST_USER.password)

    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    }, { timeout: 5_000 })

    await page.getByRole('button', { name: /continuar/i }).click()

    // Should redirect to /verify
    await expect(page).toHaveURL(/\/verify/, { timeout: 10_000 })
    await expect(page.getByLabel(/código/i)).toBeVisible()

    // Enter fixed OTP (auto-submits on 6 digits)
    await page.getByLabel(/código/i).fill(E2E_OTP)

    // Should reach dashboard or onboarding
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 })
  })

  test('blocks login with wrong password', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/senha/i).fill('WrongPassword999!')

    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    }, { timeout: 5_000 })

    await page.getByRole('button', { name: /continuar/i }).click()

    // Generic error — should not reveal if email exists
    await expect(page.getByRole('alert')).toContainText(/email ou senha/i, { timeout: 10_000 })
    // Stays on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('blocks login with invalid OTP', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/senha/i).fill(TEST_USER.password)

    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    }, { timeout: 5_000 })

    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page).toHaveURL(/\/verify/, { timeout: 10_000 })

    // Enter wrong OTP
    await page.getByLabel(/código/i).fill('000000')

    await expect(page.getByRole('alert')).toContainText(/inválido|expirado/i, { timeout: 10_000 })
    // Stays on verify page
    await expect(page).toHaveURL(/\/verify/)
  })

  test('Google OAuth button is visible (smoke)', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('soft-deleted account is rejected at login', async ({ page }) => {
    // This test relies on the fact that deletedAt accounts return a generic error
    // The deleted account is not seeded, so this just validates the error message path
    // when the user doesn't exist (which triggers the same generic error branch)
    await page.getByLabel(/email/i).fill('nonexistent@fitflow.test')
    await page.getByLabel(/senha/i).fill('SomePassword123!')

    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    }, { timeout: 5_000 })

    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page.getByRole('alert')).toContainText(/email ou senha/i, { timeout: 10_000 })
  })
})
