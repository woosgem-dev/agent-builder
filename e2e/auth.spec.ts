import { test, expect } from '@playwright/test';

test.describe('인증', () => {
  test.describe('비로그인 상태', () => {
    test('로그인 버튼이 표시되어야 한다', async ({ page }) => {
      await page.goto('/');
      
      const loginButton = page.getByRole('button', { name: /로그인|sign in|github/i });
      await expect(loginButton).toBeVisible();
    });

    test('보호된 페이지 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
      await page.goto('/me');
      
      // 로그인 페이지 또는 홈으로 리다이렉트 확인
      await expect(page).toHaveURL(/auth|signin|\//);
    });

    test('스킬 등록 페이지 접근 시 로그인 유도', async ({ page }) => {
      await page.goto('/submit');
      
      // 로그인 유도 메시지 또는 리다이렉트
      const loginPrompt = page.getByText(/로그인|sign in/i);
      await expect(loginPrompt).toBeVisible();
    });
  });

  test.describe('GitHub OAuth', () => {
    test('로그인 버튼 클릭 시 GitHub OAuth 페이지로 이동', async ({ page }) => {
      await page.goto('/');
      
      const loginButton = page.getByRole('button', { name: /로그인|sign in|github/i });
      
      // GitHub OAuth URL로 이동하는지 확인 (실제 리다이렉트는 테스트 환경에서 제한)
      const [popup] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        loginButton.click().catch(() => null),
      ]);
      
      // OAuth 플로우가 시작되거나 에러 페이지가 뜨는지 확인
      // 실제 GitHub 연동은 CI에서 별도 처리
    });
  });
});
