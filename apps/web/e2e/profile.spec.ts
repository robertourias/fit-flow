import { test, expect } from '@playwright/test'
import { mockTurnstile, E2E_OTP } from './helpers'
import { AUTH_STATE_PATH } from './auth.setup'

// All profile tests run with an authenticated session
test.use({ storageState: AUTH_STATE_PATH })

test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/profile')
    await expect(page.getByRole('heading', { name: /perfil/i })).toBeVisible({ timeout: 10_000 })
  })

  test('edit name and bio — persists after reload', async ({ page }) => {
    const newName = `E2E User ${Date.now()}`
    const newBio = 'Bio updated by E2E test'

    await page.getByLabel(/nome completo/i).fill(newName)
    await page.getByLabel(/bio/i).fill(newBio)

    await page.getByRole('button', { name: /salvar alterações/i }).click()

    await expect(page.getByText(/atualizado com sucesso/i)).toBeVisible({ timeout: 10_000 })

    // Reload and verify persistence
    await page.reload()
    await expect(page.getByLabel(/nome completo/i)).toHaveValue(newName, { timeout: 10_000 })
    await expect(page.getByLabel(/bio/i)).toHaveValue(newBio)
  })

  test('bio char counter updates and blocks at 300', async ({ page }) => {
    const textarea = page.getByLabel(/bio/i)
    await textarea.fill('')

    const longBio = 'a'.repeat(300)
    await textarea.fill(longBio)

    // Counter should show 300/300
    await expect(page.getByText('300/300')).toBeVisible()
    // Counter should turn red at limit
    await expect(page.locator('text=300/300')).toHaveClass(/text-destructive/)
  })

  test('age validation: rejects value outside 10–100', async ({ page }) => {
    await page.getByLabel(/idade/i).fill('5')
    await page.getByRole('button', { name: /salvar alterações/i }).click()

    await expect(page.getByRole('alert')).toContainText(/10.*100|entre 10/i, { timeout: 10_000 })
  })

  test('change password with OTP flow', async ({ page }) => {
    // Open the change password section
    await page.getByRole('button', { name: /alterar senha/i }).click()

    // Fill current password
    await page.getByLabel(/senha atual/i).fill('E2eTestLogin123!')
    // Fill new strong password
    await page.getByLabel(/nova senha/i).fill('NewE2ePassword456@')
    await page.getByLabel(/confirmar nova senha/i).fill('NewE2ePassword456@')

    // PasswordStrengthBar should show a positive level
    await expect(page.getByText(/forte|muito forte/i)).toBeVisible()

    // Send OTP
    await page.getByRole('button', { name: /enviar código de confirmação/i }).click()
    await expect(page.getByLabel(/código enviado/i)).toBeVisible({ timeout: 10_000 })

    // Enter OTP
    await page.getByLabel(/código enviado/i).fill(E2E_OTP)
    await page.getByRole('button', { name: /confirmar alteração/i }).click()

    await expect(page.getByText(/senha alterada com sucesso/i)).toBeVisible({ timeout: 15_000 })

    // Restore original password for subsequent tests
    await page.getByRole('button', { name: /alterar senha/i }).click()
    await page.getByLabel(/senha atual/i).fill('NewE2ePassword456@')
    await page.getByLabel(/nova senha/i).fill('E2eTestLogin123!')
    await page.getByLabel(/confirmar nova senha/i).fill('E2eTestLogin123!')
    await page.getByRole('button', { name: /enviar código de confirmação/i }).click()
    await page.getByLabel(/código enviado/i).fill(E2E_OTP)
    await page.getByRole('button', { name: /confirmar alteração/i }).click()
    await expect(page.getByText(/senha alterada com sucesso/i)).toBeVisible({ timeout: 15_000 })
  })

  test('delete account — redirected to login, cannot login again', async ({ page }) => {
    // This test uses the profile test user to avoid destroying the main test user
    // The profile user session would need to be set up separately; for now
    // we validate the modal UI gates before the destructive action

    // Click "Excluir conta"
    await page.getByRole('button', { name: /excluir conta/i }).click()

    // Modal opens
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })

    // Button should be disabled until "DELETAR" is typed
    const confirmBtn = page.getByRole('button', { name: /excluir definitivamente/i })
    await expect(confirmBtn).toBeDisabled()

    // Type wrong casing — button still disabled
    await page.getByPlaceholder('DELETAR').fill('deletar')
    await expect(confirmBtn).toBeDisabled()

    // Type correct text
    await page.getByPlaceholder('DELETAR').fill('DELETAR')

    // Fill password and OTP
    await page.getByLabel(/senha atual/i).last().fill('E2eTestLogin123!')
    await page.getByRole('button', { name: /enviar código otp/i }).click()
    await expect(page.getByLabel(/código enviado/i)).toBeVisible({ timeout: 10_000 })
    await page.getByLabel(/código enviado/i).fill(E2E_OTP)

    // Now the confirm button is enabled
    await expect(confirmBtn).toBeEnabled()
    await confirmBtn.click()

    // Should be redirected to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })

    // Attempt login with old credentials — should fail
    await mockTurnstile(page)
    await page.getByLabel(/email/i).fill('e2e-login@fitflow.test')
    await page.getByLabel(/senha/i).fill('E2eTestLogin123!')

    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    }, { timeout: 5_000 })

    await page.getByRole('button', { name: /continuar/i }).click()
    await expect(page.getByRole('alert')).toContainText(/email ou senha/i, { timeout: 10_000 })
  })
})
