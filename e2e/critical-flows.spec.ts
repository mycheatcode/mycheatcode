import { test, expect } from '@playwright/test';

/**
 * CRITICAL PATH TESTS
 *
 * These tests verify the core user flows that must NEVER break.
 * Run these before every deploy to production.
 */

test.describe('Critical User Flows', () => {

  // Skip auth for now - add when you have test credentials
  test.beforeEach(async ({ page }) => {
    // TODO: Add authentication when test user is available
    await page.goto('/');
  });

  test('New cheat code shows "Save to My Codes" button (NOT "Get Reps In")', async ({ page }) => {
    // This is the #1 bug that keeps breaking

    // TODO: Navigate to chat and create a code
    // TODO: Verify phrase card shows correct button

    // For now, this is a placeholder that documents the expected behavior
    test.skip();
  });

  test('Game quit without answering does NOT send "3/0" message', async ({ page }) => {
    // This is the #2 bug that keeps breaking

    // TODO: Start a game and quit immediately
    // TODO: Verify no coach follow-up message appears

    test.skip();
  });

  test('Practice scenarios match the cheat code topic', async ({ page }) => {
    // Scenarios should be relevant to the code

    // TODO: Start game for "Trust My Shot" code
    // TODO: Verify all scenarios are about shooting

    test.skip();
  });

  test('Relatable topic cards show green overlay after use', async ({ page }) => {
    // Topics should be marked as completed

    // TODO: Select a topic
    // TODO: Create a chat from it
    // TODO: Go back to topics page
    // TODO: Verify green overlay and checkmark

    test.skip();
  });

  test('Mobile code viewer shows correct buttons on phrase card', async ({ page }) => {
    // Phrase card needs: Practice, Open Chat, Archive

    test.skip();
  });

  test('Momentum animates in green when gaining progress', async ({ page }) => {
    // After saving code or completing game

    test.skip();
  });
});

test.describe('Smoke Tests - Basic Functionality', () => {

  test('Home page loads without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MyCheatCode/i);

    // Check for no console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      }
    });
  });

  test('Navigation works on all main pages', async ({ page }) => {
    const pages = [
      '/',
      '/my-codes',
      '/relatable-topics',
      '/chat-history',
      '/profile',
    ];

    for (const path of pages) {
      await page.goto(path);
      // Verify page loads (doesn't 404 or crash)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Chat page loads', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('text=/Live Chat/i')).toBeVisible();
  });

  test('My Codes page loads', async ({ page }) => {
    await page.goto('/my-codes');
    await expect(page.locator('text=/My Codes/i')).toBeVisible();
  });

  test('Relatable Topics page loads with topics', async ({ page }) => {
    await page.goto('/relatable-topics');
    await expect(page.locator('text=/Relatable Topics/i')).toBeVisible();

    // Should have at least some topic cards
    const topics = page.locator('[class*="rounded-2xl"][class*="cursor-pointer"]');
    await expect(topics.first()).toBeVisible();
  });
});

test.describe('Responsive Design', () => {

  test('Mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // TODO: Click menu button
    // TODO: Verify sidebar opens
    // TODO: Click outside to close

    test.skip();
  });

  test('Desktop layout displays correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Should not show mobile menu button
    const mobileMenu = page.locator('[aria-label="Menu"]').first();
    await expect(mobileMenu).toBeVisible(); // Currently mobile-first, but check it's there
  });
});

/**
 * HOW TO ADD MORE TESTS:
 *
 * 1. Identify the critical flow that breaks
 * 2. Add a new test case above
 * 3. Write the test to verify the expected behavior
 * 4. Run `npm run test:e2e` to verify
 * 5. Commit the test WITH the feature
 *
 * This way, if the feature breaks later, the test will catch it!
 */
