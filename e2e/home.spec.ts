import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test('페이지가 로드되어야 한다', async ({ page }) => {
    await page.goto('/');
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/SkillHub/);
  });

  test('헤더가 표시되어야 한다', async ({ page }) => {
    await page.goto('/');
    
    // 로고/브랜드 확인
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('검색바가 표시되어야 한다', async ({ page }) => {
    await page.goto('/');
    
    // 검색 입력란 확인
    const searchInput = page.getByPlaceholder(/찾으시나요|검색|search/i);
    await expect(searchInput).toBeVisible();
  });

  test('푸터가 표시되어야 한다', async ({ page }) => {
    await page.goto('/');
    
    // 푸터 텍스트 확인
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/WooSGem|Thrall/);
  });
});
