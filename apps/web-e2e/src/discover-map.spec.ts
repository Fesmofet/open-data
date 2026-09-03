import { expect, test } from '@playwright/test';

const UNBOXED_OBJECT = {
  object_id: 'e2e-discover-unboxed',
  object_type: 'restaurant',
  semantic_type: null,
  weight: 1.5,
  fields: {
    name: 'Unboxed Restaurant',
    geo: { latitude: 49.2, longitude: -123.1 },
  },
  isFavorited: false,
  hasSupervisedOwnership: false,
  hasExclusiveOwnership: false,
};

const BOXED_OBJECT = {
  object_id: 'e2e-discover-boxed',
  object_type: 'restaurant',
  semantic_type: null,
  weight: 2,
  fields: {
    name: 'Boxed Restaurant',
    geo: { latitude: 49.25, longitude: -123.15 },
  },
  isFavorited: false,
  hasSupervisedOwnership: false,
  hasExclusiveOwnership: false,
};

const MOCK_TAG_CATEGORIES = {
  categories: [
    {
      category: 'Cuisine',
      items: [{ value: 'Sushi', count: 3 }],
    },
  ],
};

async function mockDiscoverRoutes(page: import('@playwright/test').Page) {
  await page.route('**/api/discover/objects**', async (route) => {
    const url = route.request().url();
    const hasBox = url.includes('box=');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [hasBox ? BOXED_OBJECT : UNBOXED_OBJECT],
        cursor: null,
        hasMore: false,
      }),
    });
  });

  await page.route('**/api/discover/tag-categories**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TAG_CATEGORIES),
    });
  });

  await page.route('**/api/discover/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], cursor: null, hasMore: false }),
    });
  });
}

test.describe('Discover map area search', () => {
  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('applies map area from inline map tab', async ({ page }) => {
      await mockDiscoverRoutes(page);
      await page.goto('/discover?type=restaurant');

      await expect(page.getByText('Unboxed Restaurant')).toBeVisible();

      await page.getByRole('button', { name: 'Map' }).click();

      const searchArea = page.getByRole('button', { name: 'Search area' });
      await expect(searchArea).toBeEnabled({ timeout: 15_000 });

      await Promise.all([
        page.waitForURL(/box=/, { timeout: 15_000 }),
        searchArea.click(),
      ]);

      await page.getByRole('button', { name: 'List' }).click();
      await expect(page.getByText('Boxed Restaurant')).toBeVisible();
    });
  });

  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('shows map rail above filters and applies area search', async ({ page }) => {
      await mockDiscoverRoutes(page);
      await page.goto('/discover?type=restaurant');

      await expect(page.getByText('Unboxed Restaurant')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Filters', level: 2 })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Search area' })).toBeVisible();

      const searchArea = page.getByRole('button', { name: 'Search area' });
      await expect(searchArea).toBeEnabled({ timeout: 15_000 });

      await Promise.all([
        page.waitForURL(/box=/, { timeout: 15_000 }),
        searchArea.click(),
      ]);

      await expect(page.getByText('Boxed Restaurant')).toBeVisible();
    });

    test('removing map area chip restores unboxed results', async ({ page }) => {
      await mockDiscoverRoutes(page);
      await page.goto('/discover?type=restaurant&box=-123.5,48.5,-122.5,49.5');

      await expect(page.getByText('Boxed Restaurant')).toBeVisible();

      const unboxedResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/discover/objects') &&
          !response.url().includes('box=') &&
          response.ok(),
      );

      await Promise.all([
        page.waitForURL((url) => !url.search.includes('box='), { timeout: 15_000 }),
        page.getByRole('button', { name: 'Remove map area' }).first().click(),
      ]);

      await unboxedResponse;
      await expect(page.getByText('Unboxed Restaurant')).toBeVisible({ timeout: 15_000 });
      expect(page.url()).toContain('type=restaurant');
    });
  });

  test('hides map for non-geo object type on mobile', async ({ page }) => {
    await mockDiscoverRoutes(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/discover?type=book');
    await expect(page.getByRole('button', { name: 'Map' })).toHaveCount(0);
  });

  test('hides map rail for non-geo object type on desktop', async ({ page }) => {
    await mockDiscoverRoutes(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/discover?type=book');
    await expect(page.getByRole('button', { name: 'Search area' })).toHaveCount(0);
  });

  test('hides map in users mode on mobile', async ({ page }) => {
    await mockDiscoverRoutes(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/discover?users=1');
    await expect(page.getByRole('button', { name: 'Map' })).toHaveCount(0);
  });
});
