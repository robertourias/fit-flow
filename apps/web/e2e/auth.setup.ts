import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { mockTurnstile, E2E_OTP } from './helpers'
import { TEST_USER } from './global-setup'

export const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json')

setup('authenticate test user', async ({ page }) => {
  await mockTurnstile(page)
  await page.goto('/login')

  await page.getByLabel(/email/i).fill(TEST_USER.email)
  await page.getByLabel(/senha/i).fill(TEST_USER.password)

  // Wait for Turnstile to auto-fire
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
    return btn && !btn.disabled
  }, { timeout: 5_000 })

  await page.getByRole('button', { name: /continuar/i }).click()

  // Should land on /verify
  await expect(page).toHaveURL(/\/verify/, { timeout: 10_000 })

  await page.getByLabel(/código/i).fill(E2E_OTP)
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 })

  await page.context().storageState({ path: AUTH_STATE_PATH })
})
