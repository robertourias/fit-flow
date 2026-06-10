import { Page } from '@playwright/test'

export const E2E_OTP = '123456'

/**
 * Intercept Cloudflare Turnstile CDN and return a stub that auto-fires the
 * success callback. Must be called before page.goto().
 */
export async function mockTurnstile(page: Page) {
  await page.route('**/challenges.cloudflare.com/turnstile/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: [
        'window.turnstile = {',
        '  render: function(container, params) {',
        '    setTimeout(function() {',
        '      if (params && typeof params.callback === "function") {',
        '        params.callback("e2e-turnstile-token");',
        '      }',
        '    }, 80);',
        '    return "e2e-widget";',
        '  },',
        '  reset: function() {}',
        '};',
      ].join('\n'),
    })
  )
}

/**
 * Wait for the turnstile hidden input to be populated (widget has fired callback).
 */
export async function waitForTurnstile(page: Page) {
  // The Turnstile widget fires onSuccess → React state update → button enabled
  // Waiting for button to be enabled is the observable signal
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      return btn && !btn.disabled
    },
    { timeout: 5_000 }
  )
}

/** Fill a 6-digit OTP input and wait for auto-submit / validation. */
export async function fillOtp(page: Page, otp: string = E2E_OTP) {
  const input = page.getByRole('textbox', { name: /código/i })
  await input.fill(otp)
}

/** Generate a unique email for registration tests. */
export function uniqueEmail(): string {
  return `reg-${Date.now()}@e2e.fitflow.test`
}
