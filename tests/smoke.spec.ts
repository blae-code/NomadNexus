import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe('Public auth surfaces', () => {
  test('Login page renders core form controls', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /nomad ops login/i })).toBeVisible();
    await expect(page.getByLabel(/callsign/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('Register page renders core form controls', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /nomad ops registration/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/callsign/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /register/i })).toBeVisible();
  });
});

test.describe('Authenticated smoke (optional)', () => {
  test.beforeEach(({ page }) => {
    test.skip(
      !TEST_EMAIL || !TEST_PASSWORD,
      'Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run authenticated flows.'
    );
  });

  test('User can login and land on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/callsign/i).fill(TEST_EMAIL!);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD!);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/NomadOpsDashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/NomadOpsDashboard/);
  });
});
