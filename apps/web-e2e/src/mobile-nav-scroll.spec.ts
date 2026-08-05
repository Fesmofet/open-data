import { expect, test, type Locator, type Page, type Response } from '@playwright/test';

const PROFILE_ACCOUNT = 'guest';

async function gotoProfileOrSkip(
  page: Page,
  accountName: string,
): Promise<Response | null> {
  const response = await page.goto(`/@${accountName}`);

  if (!response?.ok() || response.status() === 404) {
    test.skip(true, `Profile requires query-api — skip when /@${accountName} is unavailable`);
  }

  const notFound = page.getByRole('heading', { name: /not found|404/i });
  if (await notFound.isVisible().catch(() => false)) {
    test.skip(true, `Profile requires query-api — /@${accountName} returned not-found UI`);
  }

  return response;
}

async function expectNavNowrap(scope: Page | Locator, name: string | RegExp) {
  const nav = scope.getByRole('navigation', { name }).first();
  await expect(nav).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(
      async () => nav.evaluate((el) => getComputedStyle(el).flexWrap),
      { timeout: 30_000 },
    )
    .toBe('nowrap');
  return nav;
}

test.describe('Mobile horizontal nav scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('profile primary nav stays on one row', async ({ page }) => {
    await gotoProfileOrSkip(page, PROFILE_ACCOUNT);

    const heroHeader = page.locator('header').filter({
      has: page.getByRole('navigation', { name: 'Profile sections' }),
    });
    await expectNavNowrap(heroHeader, 'Profile sections');
  });

  test('profile feed submenu stays on one row', async ({ page }) => {
    await gotoProfileOrSkip(page, PROFILE_ACCOUNT);
    await expectNavNowrap(page, 'Feed sections');
  });

  test('profile hero shows compact mobile meta', async ({ page }) => {
    await gotoProfileOrSkip(page, PROFILE_ACCOUNT);

    const heroHeader = page.locator('header').filter({
      has: page.getByRole('navigation', { name: 'Profile sections' }),
    });
    await expect(heroHeader).toBeVisible({ timeout: 30_000 });

    const headerRoot = heroHeader.locator('.relative.-mt-12').first();
    await expect(headerRoot).toHaveClass(/items-center/);
    await expect(page.getByText(/Vote Value|Vote value/i).first()).toBeVisible();
  });

  test('hub section nav stays on one row', async ({ page }) => {
    const response = await page.goto('/discover', { waitUntil: 'domcontentloaded' });
    if (!response?.ok()) {
      test.skip(true, 'Discover route unavailable');
    }
    await expectNavNowrap(page, 'Main sections');
  });
});
