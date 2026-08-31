import { expect, test } from '@playwright/test';

test.describe('Icon smoke', () => {
  test('header search toggle renders svg controls (TC-E01)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/discover?type=hashtag');

    const searchToggle = page.getByRole('button', { name: /open search/i });
    await expect(searchToggle).toBeVisible();
    await expect(searchToggle.locator('svg')).toHaveCount(1);

    await searchToggle.click();

    const closeToggle = page.getByRole('button', { name: /close search/i });
    await expect(closeToggle).toBeVisible();
    await expect(closeToggle.locator('svg')).toHaveCount(1);

    await closeToggle.click();
    await expect(searchToggle).toBeVisible();
  });

  test('feed story action controls render svg (TC-E02)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/@demo');

    const story = page.getByRole('article').first();
    await expect(story).toBeVisible({ timeout: 30_000 });

    const likes = story.getByRole('button', { name: 'Likes' });
    const comments = story.getByRole('button', { name: 'Comments' });
    const reblog = story.getByRole('button', { name: 'Reblog' });
    const overflow = story.getByRole('button', { name: /post actions/i });

    await expect(likes).toBeVisible();
    await expect(comments).toBeVisible();
    await expect(reblog).toBeVisible();
    await expect(overflow).toBeVisible();

    for (const button of [likes, comments, reblog, overflow]) {
      await expect(button.locator('svg')).toHaveCount(1);
      await expect(button.locator('svg')).toHaveAttribute('viewBox', /.+/);
    }
  });
});
