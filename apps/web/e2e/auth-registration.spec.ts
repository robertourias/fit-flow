import { test, expect } from '@playwright/test'
import { mockTurnstile, fillOtp, uniqueEmail, E2E_OTP } from './helpers'

const STRONG_PASSWORD = 'StrongE2ePass123!'

test.describe('Signup flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTurnstile(page)
  })

  test('complete registration: name → email → OTP → password → onboarding', async ({ page }) => {
    const email = uniqueEmail()

    await page.goto('/signup')

    // Step 1 — name + email
    await page.getByLabel(/nome/i).fill('Test Registration')
    await page.getByLabel(/email/i).fill(email)

    // Wait for Turnstile auto-fire (button enabled)
    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    }, { timeout: 5_000 })

    await page.getByRole('button', { name: /continuar/i }).click()

    // Step 2 — OTP (auto-submits on 6 digits)
    await expect(page.getByLabel(/código/i)).toBeVisible({ timeout: 10_000 })
    await fillOtp(page, E2E_OTP)

    // Step 3 — password
    await expect(page.getByLabel(/^senha/i)).toBeVisible({ timeout: 10_000 })
    await page.getByLabel(/^senha/i).fill(STRONG_PASSWORD)
    await page.getByLabel(/confirmar/i).fill(STRONG_PASSWORD)

    // PasswordStrengthBar should show Forte or Muito Forte
    await expect(page.getByText(/forte/i)).toBeVisible()

    await page.getByRole('button', { name: /criar conta/i }).click()

    // Should redirect to onboarding after auto-signin
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 20_000 })
  })

  test('blocks signup with weak password (< 12 chars)', async ({ page }) => {
    const email = uniqueEmail()

    await page.goto('/signup')
    await page.getByLabel(/nome/i).fill('Weak Pass User')
    await page.getByLabel(/email/i).fill(email)

    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    }, { timeout: 5_000 })

    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page.getByLabel(/código/i)).toBeVisible({ timeout: 10_000 })
    await fillOtp(page, E2E_OTP)

    await expect(page.getByLabel(/^senha/i)).toBeVisible({ timeout: 10_000 })

    const weakPassword = 'abc123'
    await page.getByLabel(/^senha/i).fill(weakPassword)
    await page.getByLabel(/confirmar/i).fill(weakPassword)

    // Strength bar shows Fraca
    await expect(page.getByText(/fraca/i)).toBeVisible()

    // Submit button should remain disabled (WEAK/MEDIUM level)
    const submitBtn = page.getByRole('button', { name: /criar conta/i })
    await expect(submitBtn).toBeDisabled()
  })

  test('blocks signup with already-used email', async ({ page }) => {
    // Use the fixed test login user (already registered)
    await page.goto('/signup')
    await page.getByLabel(/nome/i).fill('Duplicate Email')
    await page.getByLabel(/email/i).fill('e2e-login@fitflow.test')

    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    }, { timeout: 5_000 })

    await page.getByRole('button', { name: /continuar/i }).click()

    // Should show "Email já cadastrado" error
    await expect(page.getByRole('alert')).toContainText(/email já cadastrado/i, { timeout: 10_000 })
    // Should still be on step 1
    await expect(page.getByLabel(/nome/i)).toBeVisible()
  })
})
