/**
 * PharmaTrace — Health check E2E test
 *
 * Verifies that the application is running and the health endpoint responds.
 */

import { test, expect } from '@playwright/test';

test.describe('Application health', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PharmaTrace/);
    await expect(page.locator('h1')).toContainText('PharmaTrace');
  });

  test('health API returns OK', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.application).toBe('PharmaTrace');
  });
});
