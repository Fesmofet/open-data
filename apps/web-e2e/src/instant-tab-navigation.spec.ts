import { expect, test } from '@playwright/test';

test.describe('Instant tab navigation', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/discover/objects**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], cursor: null, hasMore: false }),
      });
    });

    await page.route('**/api/discover/users**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], cursor: null, hasMore: false }),
      });
    });

    await page.route('**/api/discover/tag-categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ categories: [] }),
      });
    });
  });

  test('discover sidebar updates URL immediately on type click', async ({ page }) => {
    await page.goto('/discover?type=hashtag');

    const usersLink = page.getByRole('link', { name: 'All', exact: true });
    await usersLink.click();

    await expect
      .poll(() => page.url(), { timeout: 2_000 })
      .toMatch(/users=1/);
  });

  test('discover back navigation restores previous type', async ({ page }) => {
    await page.goto('/discover?type=hashtag');

    await page.getByRole('link', { name: 'All', exact: true }).click();
    await expect.poll(() => page.url()).toMatch(/users=1/);

    await page.goBack();
    await expect.poll(() => page.url()).toMatch(/type=hashtag/);
  });
});
