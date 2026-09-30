import { test, expect } from '@playwright/test';

test.describe('PharmaTrace Routing & UI Integration', () => {
  test('Redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('ADMIN can access all routes', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@pharmatrace.local');
    await page.fill('input[type="password"]', 'admin123!');
    await page.click('button[type="submit"]');

    // Dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Admin Forms
    await page.goto('/admin/forms');
    await expect(page).toHaveURL(/.*\/admin\/forms/);
    
    // Admin Users
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/.*\/admin\/users/);

    // Admin Settings
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/.*\/admin\/settings/);

    // History
    await page.goto('/history');
    await expect(page).toHaveURL(/.*\/history/);
  });

  test('WORKER can access worker routes but denied admin routes', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'worker@pharmatrace.local');
    await page.fill('input[type="password"]', 'worker123!');
    await page.click('button[type="submit"]');

    // Dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Worker QR
    await page.goto('/worker/qr');
    await expect(page).toHaveURL(/.*\/worker\/qr/);

    // History
    await page.goto('/history');
    await expect(page).toHaveURL(/.*\/history/);

    // Should be redirected from Admin forms
    await page.goto('/admin/forms');
    await expect(page).not.toHaveURL(/.*\/admin\/forms/);
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
