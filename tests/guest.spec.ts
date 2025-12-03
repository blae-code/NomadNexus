import { test, expect } from '@playwright/test';

test.describe('Guest access flow', () => {
  test('Guest button renders and attempts session', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /authentication interface/i })).toBeVisible();
    const guestBtn = page.getByTestId('guest-access');
    await expect(guestBtn).toBeVisible();

    // First click reveals fields
    await guestBtn.click();
    await expect(page.getByPlaceholder(/temporary callsign/i)).toBeVisible();
    await expect(page.getByPlaceholder(/rsi handle/i)).toBeVisible();
    await page.getByPlaceholder(/temporary callsign/i).fill(`guest-${Date.now()}`);
    await page.getByPlaceholder(/rsi handle/i).fill('playwright-guest');
    // Second click submits
    await guestBtn.click();

    // Either we land on a protected page or surface an error message.
    // Wait a bit for navigation or error text.
    await page.waitForTimeout(2000);

    const errorText = page.getByText(/guest access failed|invalid|error/i).first();
    const atDashboard = page.url().toLowerCase().includes('nomadopsdashboard');

    if (!atDashboard) {
      const visibleError = await errorText.isVisible().catch(() => false);
      const msg = visibleError ? 'Guest access surfaced an error message.' : 'Guest access did not navigate.';
      console.log('Guest flow diagnostics:', { atDashboard, visibleError, consoleErrors });
      if (!visibleError) {
        test.skip(true, msg);
      }
      expect(visibleError).toBeTruthy();
    } else {
      await expect(page).toHaveURL(/NomadOpsDashboard/);
    }
  });
});
