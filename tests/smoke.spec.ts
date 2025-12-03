import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe('Public auth surfaces', () => {
test('Login page renders core form controls', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /authentication interface/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /discord/i })).toBeVisible();
    await expect(page.getByLabel(/service id/i)).toBeVisible();
    await expect(page.getByLabel(/encryption key/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /enter nexus/i })).toBeVisible();
  });

test('Register page renders core form controls', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /service record initiation/i })).toBeVisible();
    await expect(page.getByLabel(/callsign/i)).toBeVisible();
    await expect(page.getByLabel(/encryption key/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /submit service record/i })).toBeVisible();
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
    await page.getByLabel(/service id/i).fill(TEST_EMAIL!);
    await page.getByLabel(/encryption key/i).fill(TEST_PASSWORD!);
    await page.getByRole('button', { name: /enter nexus/i }).click();
    await page.waitForURL(/NomadOpsDashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/NomadOpsDashboard/);
  });
});
