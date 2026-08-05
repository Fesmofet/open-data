import { expect, test, type Page, type Response } from '@playwright/test';

const SHELL_MODE_COOKIE = 'app_shell_mode';
const PROFILE_ACCOUNT = 'guest';

/** Profile routes SSR-fetch query-api; skip when backend is unavailable. */
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

async function waitForProfileNav(page: Page) {
  const profileNav = page.getByRole('navigation', { name: 'Profile sections' });
  await expect(profileNav.first()).toBeVisible({ timeout: 30_000 });
  return profileNav;
}

test.describe('Shell mode viewport scope', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: SHELL_MODE_COOKIE,
        value: 'twitter',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('data-shell-mode cookie is applied on html', async ({ page }) => {
    await page.goto('/dev/showcase');
    await expect(page.locator('html')).toHaveAttribute('data-shell-mode', 'twitter');
  });

  test('showcase desktop-only slot is hidden on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dev/showcase');

    await expect(
      page.getByText('Visible from lg up', { exact: true }),
    ).toBeHidden();
  });

  test('showcase desktop-only slot is visible on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dev/showcase');

    await expect(
      page.getByText('Visible from lg up', { exact: true }),
    ).toBeVisible();
  });

  test('twitter mode: profile hero nav visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoProfileOrSkip(page, PROFILE_ACCOUNT);
    await waitForProfileNav(page);
  });

  test('twitter mode: profile hero header hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoProfileOrSkip(page, PROFILE_ACCOUNT);

    const heroHeader = page.locator('header').filter({
      has: page.getByRole('navigation', { name: 'Profile sections' }),
    });
    await expect(heroHeader.first()).toBeHidden({ timeout: 30_000 });
  });

  test('twitter mode: vertical profile nav visible in left rail on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoProfileOrSkip(page, PROFILE_ACCOUNT);

    const verticalRailNav = page
      .locator('.shell-show-twitter')
      .getByRole('navigation', { name: 'Profile sections' });
    await expect(verticalRailNav).toBeVisible({ timeout: 30_000 });
  });
});
