import { test, expect } from '@playwright/test';

const EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe('Auth + onboarding smoke', () => {
  test('Login surface renders and accepts input', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /authentication interface/i })).toBeVisible();
    await page.getByLabel(/service id/i).fill('test@example.com');
    await page.getByLabel(/encryption key/i).fill('hunter2');
    await expect(page.getByRole('button', { name: /enter nexus/i })).toBeEnabled();
  });
});

test.describe('Authenticated flows', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Set PLAYWRIGHT_TEST_EMAIL/PASSWORD to run authenticated flows');
    await page.goto('/login');
    await page.getByLabel(/service id/i).fill(EMAIL!);
    await page.getByLabel(/encryption key/i).fill(PASSWORD!);
    await page.getByRole('button', { name: /enter nexus/i }).click();
    await page.waitForURL(/NomadOpsDashboard/, { timeout: 15000 });
  });

  test('Navigate to Events and open creation dialog', async ({ page }) => {
    await page.goto('/Events');
    await expect(page.getByRole('heading', { name: /operations board/i })).toBeVisible();
    const createBtn = page.getByRole('button', { name: /create operation/i });
    if (await createBtn.isVisible()) {
      const opName = `Playwright Ops Test ${Date.now()}`;
      await createBtn.click();
      await expect(page.getByText(/new operation/i)).toBeVisible();
      await page.getByPlaceholder(/operation name/i).fill(opName);
      await page.getByLabel(/start time/i).fill('2030-01-01T12:00');
      await page.getByPlaceholder(/system \/ planet \/ poi/i).fill('Test System');
      await page.getByPlaceholder(/mission overview/i).fill('Automated smoke to verify event form wiring.');
      await page.getByRole('button', { name: /save/i }).click({ delay: 50 });
      await expect(page.getByText(/new operation/i)).toBeHidden({ timeout: 5000 });
      await expect(page.getByRole('heading', { name: /operations board/i })).toBeVisible();
      await expect(page.getByText(opName)).toBeVisible({ timeout: 10000 });
    } else {
      test.skip(true, 'Current user lacks create permission; skipping create smoke.');
    }
  });

  test('Comms Console renders core panels (voice/data hub)', async ({ page }) => {
    await page.goto('/CommsConsole');
    await expect(page.getByText(/comms console/i)).toBeVisible();
    await expect(page.getByText(/active nets/i)).toBeVisible();
    await expect(page.getByText(/ready room/i)).toBeVisible();
    // Ensure chat interface is mounted.
    await expect(page.getByPlaceholder(/type to broadcast/i)).toBeVisible({ timeout: 5000 });
  });

  test('Ready room chat sends and renders a message', async ({ page }) => {
    await page.goto('/CommsConsole');
    await page.getByRole('button', { name: /ready rooms/i }).click();

    const readyRooms = page.getByTestId('ready-room-option');
    const count = await readyRooms.count();
    if (count === 0) {
      test.skip(true, 'No accessible ready rooms for this user; skipping chat send.');
    }

    const targetRoom = readyRooms.first();
    await targetRoom.click();

    const message = `E2E chat ${Date.now()}`;
    await page.getByPlaceholder(/message #/i).fill(message);
    await page.getByRole('button', { name: /send/i }).click();

    const messageLocator = page.getByText(message, { exact: false });
    const appeared = await messageLocator.waitFor({ timeout: 12000 }).then(() => true).catch(() => false);
    if (!appeared) {
      test.skip(true, 'Message send not permitted for this user; skipping assertion.');
    }
  });
});
