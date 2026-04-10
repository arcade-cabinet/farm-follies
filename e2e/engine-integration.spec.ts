import { expect, test } from "@playwright/test";

// Helper to skip the splash screen
async function skipSplash(page: import("@playwright/test").Page) {
  await page.goto("/");
  const splash = page.locator(".fixed.inset-0.z-50");
  if (await splash.isVisible({ timeout: 2000 }).catch(() => false)) {
    await splash.click();
    await page.waitForTimeout(800);
  }
}

// Helper to start a game, skipping splash and tutorial
async function startGame(page: import("@playwright/test").Page) {
  // Mark tutorial as completed to skip it
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("farm-follies-tutorial-complete", "true");
  });

  await skipSplash(page);

  // Click the PLAY button
  const playButton = page.getByText("PLAY", { exact: true });
  await expect(playButton).toBeVisible({ timeout: 5000 });
  await playButton.click();
  // Wait for game to start rendering
  await page.waitForTimeout(1000);
}

test.describe("Engine Integration", () => {
  test("game canvas renders after starting game", async ({ page }) => {
    await startGame(page);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Canvas should have non-zero dimensions
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });

  test("score HUD visible during gameplay", async ({ page }) => {
    await startGame(page);

    // ScoreDisplay renders "LVL" for level
    await expect(page.getByText(/LVL/)).toBeVisible({ timeout: 3000 });
  });

  test("sound toggle accessible during gameplay", async ({ page }) => {
    await startGame(page);

    const soundToggle = page.getByRole("button", { name: /mute|unmute/i });
    await expect(soundToggle).toBeVisible();
    await soundToggle.click();
    // Should toggle without errors
    await expect(soundToggle).toBeVisible();
  });

  test("pause button visible during gameplay", async ({ page }) => {
    await startGame(page);

    const pauseBtn = page.getByRole("button", { name: /pause/i });
    await expect(pauseBtn).toBeVisible({ timeout: 5000 });
  });

  test("pause menu opens and closes", async ({ page }) => {
    await startGame(page);

    // Click pause
    const pauseBtn = page.getByRole("button", { name: /pause/i });
    await expect(pauseBtn).toBeVisible({ timeout: 5000 });
    await pauseBtn.click();
    await page.waitForTimeout(500);

    // Pause menu should appear with RESUME button
    const resumeBtn = page.getByRole("button", { name: "RESUME" });
    await expect(resumeBtn).toBeVisible({ timeout: 3000 });

    // Resume the game
    await resumeBtn.click();
    await page.waitForTimeout(500);

    // Pause button should be visible again (game resumed)
    await expect(pauseBtn).toBeVisible();
  });

  test("gameplay hint shown when stack is empty", async ({ page }) => {
    await startGame(page);

    // When stack is empty, a gameplay hint appears
    // Desktop shows "Arrow keys or drag to move", mobile shows "DRAG to catch falling animals"
    const hint = page.locator("p").filter({ hasText: /arrow keys|drag/i });
    await expect(hint).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Main Menu Flow", () => {
  test("shows Farm Follies title", async ({ page }) => {
    await skipSplash(page);

    await expect(page.getByText("Farm Follies")).toBeVisible({ timeout: 5000 });
  });

  test("shows PLAY button", async ({ page }) => {
    await skipSplash(page);

    const playButton = page.getByText("PLAY", { exact: true });
    await expect(playButton).toBeVisible({ timeout: 5000 });
  });

  test("shows SHOP button", async ({ page }) => {
    await skipSplash(page);

    const shopButton = page.getByText("SHOP", { exact: true });
    await expect(shopButton).toBeVisible({ timeout: 5000 });
  });

  test("navigates from menu to game and back", async ({ page }) => {
    // Skip tutorial
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("farm-follies-tutorial-complete", "true");
    });
    await skipSplash(page);

    // Start game
    await page.getByText("PLAY", { exact: true }).click();
    await page.waitForTimeout(1000);

    // Should see gameplay UI (pause button)
    const pauseBtn = page.getByRole("button", { name: /pause/i });
    await expect(pauseBtn).toBeVisible({ timeout: 5000 });

    // Pause and go to main menu
    await pauseBtn.click();
    await page.waitForTimeout(500);

    // Click quit to menu
    await page.getByText(/QUIT TO MENU/i).click();
    await page.waitForTimeout(500);

    // Should see PLAY button again
    await expect(page.getByText("PLAY", { exact: true })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("No Critical Errors", () => {
  test("no JS errors during full game lifecycle", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Skip tutorial for clean test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("farm-follies-tutorial-complete", "true");
    });

    // Go through full lifecycle: splash → menu → game → pause → resume
    await skipSplash(page);
    await page.getByText("PLAY", { exact: true }).click();
    await page.waitForTimeout(2000); // Let game run

    const pauseBtn = page.getByRole("button", { name: /pause/i });
    if (await pauseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pauseBtn.click();
      await page.waitForTimeout(500);
      const resume = page.getByRole("button", { name: "RESUME" });
      if (await resume.isVisible({ timeout: 2000 }).catch(() => false)) {
        await resume.click();
      }
    }
    await page.waitForTimeout(1000);

    // Filter expected warnings
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("AudioContext") &&
        !e.includes("autoplay") &&
        !e.includes("net::ERR") &&
        !e.includes("NotAllowedError") &&
        !e.includes("play()")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("no uncaught exceptions during gameplay", async ({ page }) => {
    const exceptions: string[] = [];
    page.on("pageerror", (error) => {
      exceptions.push(error.message);
    });

    await startGame(page);
    // Let the game run for a few seconds
    await page.waitForTimeout(3000);

    expect(exceptions).toHaveLength(0);
  });
});
